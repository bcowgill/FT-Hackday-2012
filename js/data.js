// data.js
// Brent S.A. Cowgill 2012-05-18
// low level data manipulation. get and store data in a DOM node as data-x attributes

/*jslint browser: true, sloppy: true, plusplus: true, maxerr: 1000, indent: 3 */
/*global Data: true, alert, window, jQuery, module, test, expect, deepEqual, ok */
/*properties
   Data, attr, getFromElement, hasOwnProperty, html, join, length, printOut,
   prototype, push, saveToElement, toString, typeName, val, append, ok, split,
   unitTests, density, def, keys, setup, width, height, hasTwo, empty, sort, replace, clearOut, equals, abs, text, notpresent, isCloseEnough
*/

if (window.Data) {
   alert("window.Data actually exists.");
}

/*
   Data()

   constructor for data objects which can be stored in various places (DOM node attributes, etc)
 */
Data = function () {
   this.val = {};
   return this;
};

Data.prototype.typeName = 'Object Data';

// length(rObj) - return a count of the number of keys in the data.val
// can also be used to get the number of keys in any other object passed into it
Data.prototype.length = function (rObj) {
   var key, length = 0;
   rObj = rObj || this.val;
   for (key in rObj) {
      if (rObj.hasOwnProperty(key)) {
         length += 1;
      }
   }
   return length;
};

// keys(rObj) - return all the keys in the data.val
// can also be used to get the keys of any other object passed into it
Data.prototype.keys = function (rObj) {
   var key, keys = [];
   rObj = rObj || this.val;
   for (key in rObj) {
      if (rObj.hasOwnProperty(key)) {
         keys.push(key);
      }
   }
   return keys;
};

// def(value, defaultValue) - set a default value for something if it's undefined
Data.prototype.def = function (value, defaultValue) {
   if (value === undefined || value === null) {
      value = defaultValue;
   }
   return value;
};

// toString(prefix, join, separator, quote) - simple conversion to a string for human readability
// defaults produce output values in 'key' = 'value' format with newline breaks
Data.prototype.toString = function (prefix, join, separator, quote) {
   var idx, key, props = [], keys = this.keys().sort();

   prefix = this.def(prefix, '');
   join = this.def(join, '\n');
   separator = this.def(separator, ' = ');
   quote = this.def(quote, "'");

   for (idx = 0; idx < keys.length; idx += 1) {
      key = keys[idx];
      props.push(quote + prefix + key + quote + separator + quote + this.val[key] + quote);
   }
   return props.join(join);
};

// printOut(msg) - output a message to the #output div
Data.prototype.printOut = function (msg) {
   var rJQ = jQuery('#output');
   if (rJQ.length) {
      msg = msg.replace(/</g, '&lt;');
      rJQ.append('<div class="output">' + msg + '</div>');
   }
   return this;
};

// clearOut() - clear the #output div
Data.prototype.clearOut = function () {
   var rJQ = jQuery('#output');
   if (rJQ.length) {
      rJQ.html('');
   }
   return this;
};

// ok(got, expect, why) - print out a check whether we got what we expected.
Data.prototype.ok = function (got, expect, why) {
   if (got === expect) {
      this.printOut("ok(" + got + ") - " + why);
   } else {
      this.printOut("not ok(" + got + ", " + expect + ") - " + why);
   }
   return this;
};

// get metadata from a DOM element.
// reads from attributes with the prefix data-
// jqsel is a jQuery selection string.
// attrs is a comma separated string of attribute names to read, minus the data- prefix.
//
// eg: data = new Data(); data.getfromelement('#object', 'density,friction')
// <div id='#object' data-density='23'>
// => { density: 23, friction: undefined}
Data.prototype.getFromElement = function (jqsel, attrs) {
   var rJQ = jQuery(jqsel), idx, key, Attrs = attrs.split(',');
   idx = Attrs.length;
   while (idx--) {
      key = Attrs[idx];
      this.val[key] = rJQ.attr('data-' + key);
   }
   return this;
};

// save metadata to a DOM element.
// stores attributes with a data- prefix.
// jqsel is a jQuery selection string.
//
// eg: data = new Data(); data.val.density = 23;
// data.savetoelement('#object') ==> <div id='object' data-density='23'>
Data.prototype.saveToElement = function (jqsel) {
   var rJQ = jQuery(jqsel), key;
   for (key in this.val) {
      if (this.val.hasOwnProperty(key)) {
         rJQ.attr('data-' + key, this.val[key]);
      }
   }
   return this;
};

// compare if two numbers are close enough to identical
// epsilon - the maximum difference allowed to be considered identical
Data.prototype.equals = function (value1, value2, epsilon) {
   return (Math.abs(value1 - value2) < epsilon);
};

// QUnit helper function to verify that float values are identical enough
Data.prototype.isCloseEnough = function (got, expected, epsilon, msg) {
   var expectDesc = got + " equals " + expected + " within " + epsilon;
   if (this.equals(got, expected, epsilon)) {
      deepEqual(expectDesc, expectDesc, msg);
   } else {
      deepEqual(got + " within " + epsilon, expected, msg);
   }
};


//=========================================================================

Data.prototype.unitTests = function () {
   var Setup = {
      'setup': function () {
         this.empty = new Data();
         this.hasTwo = new Data();
         this.hasTwo.val.width = 12;
         this.hasTwo.val.height = 14;
      }
   };

   module("new Data() - returns a new empty data object", Setup);
   test("new Data()", function () {
      expect(2);

      deepEqual(this.empty.typeName, "Object Data", "data.typeName should be");
      deepEqual(this.empty.length(), 0, "new Data(), length() of data.val should be");
   });

   module("length() - returns the number of keys in data.val", Setup);
   test("length()", function () {
      expect(3);

      deepEqual(this.empty.length(), 0, "new Data(), length() of data.val should be");
      deepEqual(this.hasTwo.length(), 2, "add two values to data.val, length() should be");
      deepEqual(this.hasTwo.length({}), 0, "get length of any other empty object should be");
   });

   module("keys() - returns all the keys in data.val", Setup);
   test("keys()", function () {
      expect(4);

      deepEqual(this.empty.keys().length, 0, "new Data(), keys().length of data.val should be");
      deepEqual(this.hasTwo.keys().length, 2, "add two values to data.val, keys().length should be");
      deepEqual(this.hasTwo.keys().sort(), ['height', 'width'], "add two values to data.val, keys() should be");
      deepEqual(this.hasTwo.keys({}), [], "get keys of any other empty object should be");
   });

   module("def() - assign a default value in case of undefined values", Setup);
   test("def()", function () {
      expect(7);

      deepEqual(this.empty.def(undefined, 'default'), "default", "default of undefined should be");
      deepEqual(this.empty.def(null, 'default'), "default", "default of null should be");
      deepEqual(this.empty.def(false, 'default'), false, "default of false should be");
      deepEqual(this.empty.def(0, 'default'), 0, "default of number zero should be");
      deepEqual(this.empty.def('', 'default'), "", "default of an empty string should be");
      deepEqual(this.empty.def('0', 'default'), "0", "default of zero string should be");
      deepEqual(this.empty.def('value', 'default'), "value", "default non-empty string should be");
   });

   module("toString() - reduce the data to a readable string", Setup);
   test("toString()", function () {
      expect(3);

      deepEqual(this.empty.toString(), "", "new Data(), toString() should be");
      deepEqual(this.hasTwo.toString(), "'height' = '14'\n'width' = '12'", "add two values to data.val, toString() should be");
      deepEqual(this.hasTwo.toString('_', '; ', ': ', ''), "_height: 14; _width: 12", "specify prefix, join, separator, quote characters, toString('_', '; ', ': ', '') should be");
   });

   module("printOut() - append a message to an #output element", Setup);
   test("printOut()", function () {
      expect(3);

      this.empty.clearOut();
      this.empty.printOut('greetings from printOut()');
      deepEqual(jQuery('#output div.output').length, 1, 'printOut() output lines should be');
      deepEqual(jQuery('#output div.output').text(), 'greetings from printOut()', 'printOut() output should be');

      this.empty.printOut('<quoted>');
      deepEqual(jQuery('#output div.output').text(), 'greetings from printOut()<quoted>', 'printOut() output should be');
   });

   module("ok() - check if a value is ok and output to the #output element", Setup);
   test("printOut()", function () {
      expect(1);

      this.empty.clearOut();
      this.empty.ok(true, false, 'is it true');
      this.empty.ok(true, true, 'is it true');
      deepEqual(jQuery('#output div.output').text(), 'not ok(true, false) - is it trueok(true) - is it true', 'ok() output should be');
   });

   module("getFromElement() - read metadata from DOM element", Setup);
   test("getFromElement('#getFromElement')", function () {
      expect(6);
      this.empty.getFromElement('#getFromElement', 'density');
      deepEqual(this.empty.length(), 1, 'getFromElement() keys found should be');
      deepEqual(this.empty.val.density, '675', 'getFromElement() data.val.density should be');

      this.empty = new Data();
      this.empty.getFromElement('#getFromElement', 'notpresent');
      deepEqual(this.empty.length(), 1, 'getFromElement() keys found should be');
      deepEqual(this.empty.val.notpresent, undefined, 'getFromElement() data.val.notpresent default  should be');

      this.hasTwo.getFromElement('#getFromElement', 'density');
      deepEqual(this.hasTwo.length(), 3, 'getFromElement() keys found should be');
      deepEqual(this.hasTwo.val.density, '675', 'getFromElement() data.val.density should be');
   });

   module("saveToElement() - write metadata to a DOM element", Setup);
   test("saveToElement(#saveToElement)", function () {
      expect(2);

      this.empty.getFromElement('#saveToElement', 'density');
      deepEqual(this.empty.val.density, '265', 'getFromElement() density should be');
      this.empty.val.density = '654';
      this.empty.saveToElement('#saveToElement');
      this.empty.val.density = '123';
      this.empty.getFromElement('#saveToElement', 'density');
      deepEqual(this.empty.val.density, '654', 'getFromElement() saved density value should be');
   });

   module("equals() - check if two values are practically identical within an epsilon value", Setup);
   test("equals()", function () {
      expect(2);

      ok(this.empty.equals(3.1, 3.4, 0.5), "equals(3.1, 3.4, 0.5) close enough should be true");
      deepEqual(this.empty.equals(3.1, 4.4, 0.5), false, "equals(3.1, 4.4, 0.5) differs should be");
   });

   return this;
};

