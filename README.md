# **Vistta Console Library**

The `Console` object provides a set of methods for logging messages to the console. It allows for different log levels, formatting options, and time tracking.

## **Getting Started**

### **Install**

```sh
npm install @vistta/console
```

### **Usage**

```javascript
import "@vistta/console.js";

// Log a message
console.log("Hello, world!");

// Log an error
console.error("Something went wrong!");

// Log a warning
console.warn("Attention required!");

// Log a debug message
console.debug("This is a debug message.");

// Group messages
console.group("Group 1");
console.log("Message 1");
console.log("Message 2");
console.groupEnd();

// Time a function
console.time("function_name");
// Function code here
console.timeEnd("function_name");

// Time a function
const newConsole = new console.Console({ index: 1 });
newConsole.log("Index 1");
console.log("Index 0");
```

## **API**

Features

### **Properties**

The following properties are available:

-

### **Instance Methods**

The following methods are available:

-

## **License**

Attribution-NonCommercial-NoDerivatives 4.0 International

## **Contributing**

Thank you for your interest in contributing to this project! Please ensure that any contributions respect the licensing terms specified. If you encounter any issues or have suggestions, feel free to report them. All issues will be well received and addressed to the best of our ability. We appreciate your support and contributions!

### **Authors**

- [Tiago Terenas Almeida](https://github.com/tiagomta)
