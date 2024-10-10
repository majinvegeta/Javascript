class SimplePromise {
  constructor(executor) {
    this.state = 'pending'; // Initial state
    this.value = undefined;  // Value of the promise
    this.successCallbacks = []; // Success callbacks
    this.failureCallbacks = []; // Failure callbacks

    // Bind the resolve and reject functions
    const resolve = this.resolve.bind(this);
    const reject = this.reject.bind(this);

    // Execute the executor function immediately
    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  // Resolve the promise
  resolve(value) {
    if (this.state === 'pending') {
      this.state = 'fulfilled';
      this.value = value;
      // Execute success callbacks
      this.successCallbacks.forEach(callback => callback(value));
    }
  }

  // Reject the promise
  reject(reason) {
    if (this.state === 'pending') {
      this.state = 'rejected';
      this.value = reason;
      // Execute failure callbacks
      this.failureCallbacks.forEach(callback => callback(reason));
    }
  }

  // Then method for chaining promises
  then(onFulfilled, onRejected) {
    return new SimplePromise((resolve, reject) => {
      const handleFulfilled = (value) => {
        if (onFulfilled) {
          try {
            const result = onFulfilled(value);
            if (result instanceof SimplePromise) {
              // If the onFulfilled callback returns a promise, chain it
              result.then(resolve, reject);
            } else {
              resolve(result); // Otherwise, resolve with the returned value
            }
          } catch (error) {
            reject(error); // Catch any errors
          }
        } else {
          resolve(value); // Resolve with the original value if no callback is provided
        }
      };

      const handleRejected = (reason) => {
        if (onRejected) {
          try {
            const result = onRejected(reason);
            if (result instanceof SimplePromise) {
              // If the onRejected callback returns a promise, chain it
              result.then(resolve, reject);
            } else {
              resolve(result); // Otherwise, resolve with the returned value
            }
          } catch (error) {
            reject(error); // Catch any errors
          }
        } else {
          reject(reason); // Reject with the original reason if no callback is provided
        }
      };

      if (this.state === 'fulfilled') {
        handleFulfilled(this.value);
      } else if (this.state === 'rejected') {
        handleRejected(this.value);
      } else {
        // If the promise is still pending, add callbacks to the respective arrays
        this.successCallbacks.push(handleFulfilled);
        this.failureCallbacks.push(handleRejected);
      }
    });
  }

  // Catch method for handling errors
  catch(onRejected) {
    return this.then(null, onRejected);
  }

  // Static method for Promise.all
  static all(promises) {
    return new SimplePromise((resolve, reject) => {
      const results = [];
      let completedPromises = 0;

      promises.forEach((promise, index) => {
        promise.then(value => {
          results[index] = value; // Store the result
          completedPromises++;

          // If all promises have completed, resolve with results
          if (completedPromises === promises.length) {
            resolve(results);
          }
        }).catch(reject); // If any promise rejects, reject the whole promise
      });
    });
  }

  // Static method for Promise.any
  static any(promises) {
    return new SimplePromise((resolve, reject) => {
      const errors = [];
      let rejectedPromises = 0;

      promises.forEach((promise, index) => {
        promise.then(resolve) // Resolve immediately on success
          .catch(error => {
            errors[index] = error; // Store the error
            rejectedPromises++;

            // If all promises have rejected, reject with an AggregateError
            if (rejectedPromises === promises.length) {
              reject(new AggregateError(errors, "All promises were rejected"));
            }
          });
      });
    });
  }

  // Static method for Promise.race
  static race(promises) {
    return new SimplePromise((resolve, reject) => {
      promises.forEach(promise => {
        promise.then(resolve) // Resolve as soon as one promise resolves
               .catch(reject); // Reject as soon as one promise rejects
      });
    });
  }
}

// Define AggregateError for Promise.any
class AggregateError extends Error {
  constructor(errors, message) {
    super(message);
    this.errors = errors; // Store the array of errors
  }
}
