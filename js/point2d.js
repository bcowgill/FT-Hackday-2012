// point2d.js
// Brent S.A. Cowgill 2012-05-19
// two dimensional coordinate positioning library

/*jslint browser: true, sloppy: true, plusplus: true, maxerr: 1000, indent: 3 */
/*global Point2D: true, alert, window, jQuery, module, test, expect, deepEqual, Data */
/*properties
   Point2D, attr, getFromElement, hasOwnProperty, html, join, length, printOut,
   prototype, push, saveToElement, toString, typeName, value, append, ok, split,
   unitTests, density, def, keys, setup, width, height, hasTwo, empty, sort,
   scrollLeft, scrollTop, scrollWidth, scrollHeight,
   offsetLeft, offsetTop, offsetWidth, offsetHeight,
   clientLeft, clientTop, clientWidth, clientHeight,
   xval, yval, add, scale, divide, getPoint, css, getZoomFactors, topleft, size,
   getLogicalDimensions, getZoomedDimensions, tenTwenty, isCloseEnough,
   epsilon, data, Zoom, nudgeElement, subtract
*/

if (window.Point2D) {
   alert("window.Point2D actually exists.");
}

/*
   Point2D()

   constructor for two dimensional point data
 */
Point2D = function (xval, yval) {
   this.xval = xval || 0;
   this.yval = yval || 0;
   if (typeof this.xval !== 'number') {
      this.xval = parseFloat(this.xval);
   }
   if (typeof this.yval !== 'number') {
      this.yval = parseFloat(this.yval);
   }
   return this;
};

Point2D.prototype.typeName = 'Object Point2D';

// clone() - makes a copy of the point
Point2D.prototype.clone = function () {
   var point = new Point2D(this.xval, this.yval);
   return point;
};

// toString(decimals) - simple conversion to a string for human readability
// produces output: ( xval, yval )
Point2D.prototype.toString = function (decimals) {
   var string;
   if (decimals) {
      string = "( " + this.xval.toFixed(decimals) + ", " + this.yval.toFixed(decimals) + " )"
   } else {
      string = "( " + this.xval + ", " + this.yval + " )"
   }
   return string;
};

// add(point) - add another point to the point
Point2D.prototype.add = function (point) {
   if (typeof point === 'number') {
      this.xval += point;
      this.yval += point;
   } else {
      this.xval += point.xval;
      this.yval += point.yval;
   }
   return this;
};

// subtract(point) - subtractanother point from the point
Point2D.prototype.subtract = function (point) {
   if (typeof point === 'number') {
      this.xval -= point;
      this.yval -= point;
   } else {
      this.xval -= point.xval;
      this.yval -= point.yval;
   }
   return this;
};

// scale(factor) - scale the point by the factor provided
Point2D.prototype.scale = function (factor) {
   this.xval *= factor;
   this.yval *= factor;
   return this;
};

// divide(factor) - divide the point by the factor provided
Point2D.prototype.divide = function (factor) {
   this.xval /= factor;
   this.yval /= factor;
   return this;
};

// getPoint(point, topleft, size) - get the named point given the topleft and size
// point is an optional string reflecting which point of the element to retrieve.
//    center (default), size, topleft, topright, bottomleft, bottomright
Point2D.prototype.getPoint = function (point, topleft, size) {
   var data = new Data();
   point = data.def(point, "center");
   switch (point) {
   case 'notfound':
      this.xval = this.yval = 0;
      break;
   case 'size':
      this.xval = size.xval;
      this.yval = size.yval;
      break;
   case 'topleft':
      this.xval = topleft.xval;
      this.yval = topleft.yval;
      break;
   case 'topright':
      this.xval = topleft.xval + size.xval - 1;
      this.yval = topleft.yval;
      break;
   case 'bottomright':
      this.xval = topleft.xval + size.xval - 1;
      this.yval = topleft.yval + size.yval - 1;
      break;
   case 'bottomleft':
      this.xval = topleft.xval;
      this.yval = topleft.yval + size.yval - 1;
      break;
   case 'center':
   default: // jslint empty case ok
      this.xval = topleft.xval + (size.xval - 1) / 2;
      this.yval = topleft.yval + (size.yval - 1) / 2;
      break;
   }
   return this;
};

// getFromElement(jqsel, point, type) -  get a point from a DOM element.
// reads the current geometry positioning values for the DOM element provided
// jqsel is a jQuery selection string.
// point is an optional string reflecting which point of the element to retrieve.
//    center (default), size, topleft, topright, bottomleft, bottomright
// type is type of point/size to get.
//    client (default) , offset or scroll
//
// eg: point = new Point2D(); point.getfromelement('#object', 'topleft', 'offset')

// clientWidth Property information
// http://help.dottoro.com/ljmclkbi.php
// reliable size of browser window and scroll position
// http://www.howtocreate.co.uk/tutorials/javascript/browserwindow
// IE Box Model Bug
// http://en.wikipedia.org/wiki/Internet_Explorer_box_model_bug

Point2D.prototype.getFromElement = function (jqsel, point, type) {
   var rJQ = jQuery(jqsel), data = new Data(), topleft = new Point2D(), size = new Point2D();
   point = data.def(point, "center");
   type  = data.def(type, "client");
   if (rJQ.length === 0) {
      this.xval = this.yval = 0;
   } else if (type === 'css') {
      topleft.xval = rJQ.css('left');
      topleft.yval = rJQ.css('top');
      size.xval    = rJQ.css('width');
      size.yval    = rJQ.css('height');

      topleft.xval = parseFloat(topleft.xval);
      topleft.yval = parseFloat(topleft.yval);
      size.xval    = parseFloat(size.xval);
      size.yval    = parseFloat(size.yval);

      this.getPoint(point, topleft, size);
   } else {
      topleft.xval = rJQ[0][type + 'Left'];
      topleft.yval = rJQ[0][type + 'Top'];
      size.xval    = rJQ[0][type + 'Width'];
      size.yval    = rJQ[0][type + 'Height'];
      this.getPoint(point, topleft, size);
   }
   return this;
};

// getZoomFactors(jqsel) - compute zoom factor values in case the page has been zoomed with Ctrl + or Ctrl Mouse Wheel
// requires there be a 10px x 10px div positioned relaatively 10px, 10px within another div.
// jqsel is the jquery selector which locates the inner 10px x 10px div.
Point2D.prototype.getZoomFactors = function (jqsel) {
   var topleft = new Point2D(), size = new Point2D();

   // Retrieve css position and size of object which we know is 10px x 10px
   // and positioned relative at 10px, 10px. This allows us to compute the Ctrl + zoom factcor
   topleft.getFromElement(jqsel, 'topleft', 'css').divide(10);
   size.getFromElement(jqsel, 'size', 'css').divide(10);
   return {
      'topleft': topleft,
      'size': size
   };
};

// getLogicalDimensions(jqsel, rZoom) - compute the logical dimensions (unzoomed) of an object
// jqsel is the jquery selector of the object to get the dimensions of
// rZoom is reference to the Ctrl + zoom factor from getZoomFactors function call
Point2D.prototype.getLogicalDimensions = function (jqsel, rZoom) {
   var topleft = new Point2D(), size = new Point2D();
   topleft.getFromElement(jqsel, 'topleft', 'css');
   size.getFromElement(jqsel, 'size', 'css');

   topleft.xval /= rZoom.topleft.xval;
   topleft.yval /= rZoom.topleft.yval;
   size.xval /= rZoom.size.xval;
   size.yval /= rZoom.size.yval;
   return {
      'topleft': topleft,
      'size': size
   };
};

// getPhysicalDimensions(jqsel, rZoom) - compute the zoomed dimensions (physical) of an object
// jqsel is the jquery selector of the object to get the dimensions of
// rZoom is reference to the Ctrl + zoom factor from getZoomFactors function call
// NOTE: IE, Firefox, Opera returns the same value for Logical and Zoomed dimensions.
//    Google Chrome, Safari returns different Logical and Zoomed dimensions.
Point2D.prototype.getZoomedDimensions = function (jqsel, rZoom) {
   var topleft = new Point2D(), size = new Point2D();
   topleft.getFromElement(jqsel, 'topleft', 'css');
   size.getFromElement(jqsel, 'size', 'css');

   // When zoomed, size zoom factor differs from position zoom factor
   if (rZoom.size.xval === 1) {
      size.xval *= rZoom.topleft.xval;
   }
   if (rZoom.size.yval === 1) {
      size.yval *= rZoom.topleft.yval;
   }

   return {
      'topleft': topleft,
      'size': size
   };
};

// saveToElement(jqsel, point, size) - modify the position or size of a DOM element using the point.
// jqsel is a jQuery selection string for the object to save to
// point is an optional string reflecting which point of the element to modify.
//    center (default), size, topleft, topright, bottomleft, bottomright
// size is the somewhat optional current logical size of the element
//    this is only needed when point is not topleft or size
Point2D.prototype.saveToElement = function (jqsel, point, size) {
   var rJQ = jQuery(jqsel), data = new Data();
   point = data.def(point, "center");
   if (rJQ.length > 0) {
      switch (point) {
      case 'size':
         rJQ.css('width',  this.xval + 'px');
         rJQ.css('height', this.yval + 'px');
         break;
      case 'topleft':
         rJQ.css('left', this.xval + 'px');
         rJQ.css('top',  this.yval + 'px');
         break;
      case 'topright':
         rJQ.css('left', (this.xval - (size.xval - 1)) + 'px');
         rJQ.css('top',  this.yval + 'px');
         break;
      case 'bottomleft':
         rJQ.css('left', this.xval + 'px');
         rJQ.css('top',  (this.yval - (size.yval - 1)) + 'px');
         break;
      case 'bottomright':
         rJQ.css('left', (this.xval - (size.xval - 1)) + 'px');
         rJQ.css('top',  (this.yval - (size.yval - 1)) + 'px');
         break;
      case 'center':
      default: // jslint empty case ok
         rJQ.css('left', (this.xval - (size.xval - 1) / 2) + 'px');
         rJQ.css('top',  (this.yval - (size.yval - 1) / 2) + 'px');
         break;
      }
   }

   return this;
};

// nudgeElement(jqsel, rZoom) - nudge the position of the element using this point
// jqsel is a jQuery selection string for the object to save to
// rZoom is reference to the Ctrl + zoom factor from getZoomFactors function call
Point2D.prototype.nudgeElement = function (jqsel, rZoom) {
   var rJQ = jQuery(jqsel), where = this.getLogicalDimensions(jqsel, rZoom);
   if (rJQ.length > 0) {
      where.topleft.add(this);
      where.topleft.saveToElement(jqsel, 'topleft');
   }

   return this;
};

// magnitude() - compute the magnitude of the point as if it were a vector
Point2D.prototype.magnitude = function () {
   var magnitude = Math.sqrt(this.xval * this.xval + this.yval * this.yval);
   return magnitude;
};

// getUnitVector() - compute the unit vector for the point
Point2D.prototype.getUnitVector = function () {
   var unit = this.clone();
   unit.divide(unit.magnitude());
   return unit;
};

// applyCeiling() - if the point magnitude exceeds the ceiling value, rescale it to the ceiling value
Point2D.prototype.applyCeiling = function (ceiling) {
   var magnitude = this.magnitude();
   if (ceiling && magnitude && (magnitude > Math.abs(ceiling))) {
      this.scale(ceiling / magnitude);
   }
   return this;
};

// applyFloor() - if the point magnitude is below the floor value, rescale it to the floor value
Point2D.prototype.applyFloor = function (floor) {
   var magnitude = this.magnitude();
   if (floor && magnitude && magnitude < Math.abs(floor)) {
      this.scale(floor / magnitude);
   }
   return this;
};

// dotProduct() - compute the vector dot product with another vector
Point2D.prototype.dotProduct = function (vector) {
   var dot = this.xval * vector.yval + this.yval * vector.xval;
   return dot;
};

//=========================================================================

Point2D.prototype.unitTests = function () {
   var Setup = {
      'setup': function () {
         this.epsilon = 2;
         this.data = new Data();
         this.empty = new Point2D();
         this.tenTwenty = new Point2D(10, 20);
         this.Zoom = this.empty.getZoomFactors('#zoomindicator');
         jQuery('#saveToElement').css('width', '32px').css('height', '47px').css('top', '36px').css('left', '79px');
      }
   };

   module("new Point2D() - returns a new 2D point", Setup);
   test("new Point2D() at origin", function () {
      expect(3);

      deepEqual(this.empty.typeName, "Object Point2D", "point.typeName should be");
      deepEqual(this.empty.xval, 0, "new Point2D(), point.xval should be");
      deepEqual(this.empty.yval, 0, "new Point2D(), point.yval should be");
   });

   test("new Point2D(10,20)", function () {
      expect(2);

      deepEqual(this.tenTwenty.xval, 10, "new Point2D(), point.xval should be");
      deepEqual(this.tenTwenty.yval, 20, "new Point2D(), point.yval should be");
   });

   module("toString() - returns a string representation of 2D point", Setup);
   test("toString()", function () {
      expect(2);

      deepEqual(this.empty.toString(), "( 0, 0 )", "origin string representation should be");
      deepEqual(this.tenTwenty.toString(), "( 10, 20 )", "string representation should be");
   });

   module("clone() - clone a point value", Setup);
   test("clone()", function () {
      expect(2);

      this.empty = this.tenTwenty.clone();
      this.tenTwenty.xval = 15;
      deepEqual(this.empty.toString(), "( 10, 20 )", "string representation should be");
      deepEqual(this.tenTwenty.toString(), "( 15, 20 )", "string representation should be");
   });

   module("add() - add a value or another point to the point", Setup);
   test("add()", function () {
      expect(3);

      this.empty.add(this.tenTwenty);
      deepEqual(this.empty.toString(), "( 10, 20 )", "added points should be");
      this.empty.add(2);
      deepEqual(this.empty.toString(), "( 12, 22 )", "added constant should be");
      this.empty.add(-0.5);
      deepEqual(this.empty.toString(), "( 11.5, 21.5 )", "added fractional constant should be");
   });

   module("subtract() - subtract a value or another point from the point", Setup);
   test("subtract()", function () {
      expect(3);

      this.empty.subtract(this.tenTwenty);
      deepEqual(this.empty.toString(), "( -10, -20 )", "subtracted points should be");
      this.empty.subtract(2);
      deepEqual(this.empty.toString(), "( -12, -22 )", "subtracted constant should be");
      this.empty.subtract(-0.5);
      deepEqual(this.empty.toString(), "( -11.5, -21.5 )", "subtracted fractional constant should be");
   });

   module("scale() - multiply a point by a value to scale it", Setup);
   test("scale()", function () {
      expect(1);

      this.tenTwenty.scale(0.5);
      deepEqual(this.tenTwenty.toString(), "( 5, 10 )", "scaled point should be");
   });

   module("divide() - divide a point by a value to reduce it", Setup);
   test("divide()", function () {
      expect(1);

      this.tenTwenty.divide(2);
      deepEqual(this.tenTwenty.toString(), "( 5, 10 )", "divided point should be");
   });

   module("getPoint() - compute points on rectangle given topleft and size points", Setup);
   test("getPoint('center') - compute center point", function () {
      expect(2);

      var point = 'center', Logical = this.empty.getLogicalDimensions('#targetPoint', this.Zoom);
      this.empty.getPoint(point, Logical.topleft, Logical.size);
      this.data.isCloseEnough(this.empty.xval, 77, this.epsilon, "target element center xval should be");
      this.data.isCloseEnough(this.empty.yval, 69, this.epsilon, "target element center yval should be");
   });
   test("getPoint('size') - compute size point", function () {
      expect(2);

      var point = 'size', Logical = this.empty.getLogicalDimensions('#targetPoint', this.Zoom);
      this.empty.getPoint(point, Logical.topleft, Logical.size);
      deepEqual(this.empty.xval, 20, "target element width should be");
      deepEqual(this.empty.yval, 20, "target element height should be");
   });
   test("getPoint('topleft') - compute top left point", function () {
      expect(2);

      var point = 'topleft', Logical = this.empty.getLogicalDimensions('#targetPoint', this.Zoom);
      this.empty.getPoint(point, Logical.topleft, Logical.size);
      deepEqual(this.empty.xval, 67, "target element left xval should be");
      deepEqual(this.empty.yval, 59, "target element top yval should be");
   });
   test("getPoint('topright') - compute top right point", function () {
      expect(2);

      var point = 'topright', Logical = this.empty.getLogicalDimensions('#targetPoint', this.Zoom);
      this.empty.getPoint(point, Logical.topleft, Logical.size);
      deepEqual(this.empty.xval, 86, "target element right xval should be");
      deepEqual(this.empty.yval, 59, "target element top yval should be");
   });
   test("getPoint('bottomleft') - compute bottom left point", function () {
      expect(2);

      var point = 'bottomleft', Logical = this.empty.getLogicalDimensions('#targetPoint', this.Zoom);
      this.empty.getPoint(point, Logical.topleft, Logical.size);
      deepEqual(this.empty.xval, 67, "target element left xval should be");
      deepEqual(this.empty.yval, 78, "target element bottom yval should be");
   });
   test("getPoint('bottomright') - compute bottom right point", function () {
      expect(2);

      var point = 'bottomright', Logical = this.empty.getLogicalDimensions('#targetPoint', this.Zoom);
      this.empty.getPoint(point, Logical.topleft, Logical.size);
      deepEqual(this.empty.xval, 86, this.epsilon, "target element right xval should be");
      deepEqual(this.empty.yval, 78, this.epsilon, "target element bottom yval should be");
   });

   module("getFromElement() - get 2D coordinate point of the given DOM element", Setup);
   test("getFromElement() - non-existent element", function () {
      expect(1);

      var point = 'size';
      this.empty.getFromElement('#object-not-found', point);
      deepEqual(this.empty.toString(), "( 0, 0 )", "default if element not found should be");
   });

   test("getFromElement('size', ...)", function () {
      expect(8);

      var point = 'size', rObj = jQuery('#getFromElement')[0];
      this.empty.getFromElement('#getFromElement', point);
      deepEqual(this.empty.xval, rObj.clientWidth,  "client size/width of the object should be");
      deepEqual(this.empty.yval, rObj.clientHeight, "client size/height of the object should be");
      this.empty.xval = this.empty.yval = -1;

      this.empty.getFromElement('#getFromElement', point, 'offset');
      deepEqual(this.empty.xval, rObj.offsetWidth,  "offset size/width of the object should be");
      deepEqual(this.empty.yval, rObj.offsetHeight, "offset size/height of the object should be");
      this.empty.xval = this.empty.yval = -1;

      this.empty.getFromElement('#getFromElement', point, 'scroll');
      deepEqual(this.empty.xval, rObj.scrollWidth,  "scroll size/width of the object should be");
      deepEqual(this.empty.yval, rObj.scrollHeight, "scroll size/height of the object should be");
      this.empty.xval = this.empty.yval = -1;

      this.empty.getFromElement('#getFromElement', point, 'css');
      deepEqual(this.empty.xval + 'px', jQuery(rObj).css('width'),  "css size/width of the object should be");
      deepEqual(this.empty.yval + 'px', jQuery(rObj).css('height'), "css size/height of the object should be");
      this.empty.xval = this.empty.yval = -1;
   });

   test("getFromElement('topleft', ...)", function () {
      expect(8);

      var point = 'topleft', rObj = jQuery('#getFromElement')[0];
      this.empty.getFromElement('#getFromElement', point);
      deepEqual(this.empty.xval, rObj.clientLeft, "client left of the object should be");
      deepEqual(this.empty.yval, rObj.clientTop,  "client top of the object should be");
      this.empty.xval = this.empty.yval = -1;

      this.empty.getFromElement('#getFromElement', point, 'offset');
      deepEqual(this.empty.xval, rObj.offsetLeft, "offset left of the object should be");
      deepEqual(this.empty.yval, rObj.offsetTop,  "offset top of the object should be");
      this.empty.xval = this.empty.yval = -1;

      this.empty.getFromElement('#getFromElement', point, 'scroll');
      deepEqual(this.empty.xval, rObj.scrollLeft, "scroll left of the object should be");
      deepEqual(this.empty.yval, rObj.scrollTop,  "scroll top of the object should be");
      this.empty.xval = this.empty.yval = -1;

      this.empty.getFromElement('#getFromElement', point, 'css');
      deepEqual(this.empty.xval + 'px', jQuery(rObj).css('left'), "css left of the object should be");
      deepEqual(this.empty.yval + 'px', jQuery(rObj).css('top'),  "css top of the object should be");
      this.empty.xval = this.empty.yval = -1;
   });

   test("getFromElement('bottomright', ...)", function () {
      expect(8);

      var point = 'bottomright', rObj = jQuery('#getFromElement')[0];
      this.empty.getFromElement('#getFromElement', point);
      deepEqual(this.empty.xval, rObj.clientLeft + rObj.clientWidth  - 1, "client right of the object should be");
      deepEqual(this.empty.yval, rObj.clientTop  + rObj.clientHeight - 1, "client bottom of the object should be");
      this.empty.xval = this.empty.yval = -1;

      this.empty.getFromElement('#getFromElement', point, 'offset');
      deepEqual(this.empty.xval, rObj.offsetLeft + rObj.offsetWidth  - 1, "offset right of the object should be");
      deepEqual(this.empty.yval, rObj.offsetTop  + rObj.offsetHeight - 1, "offset bottom of the object should be");
      this.empty.xval = this.empty.yval = -1;

      this.empty.getFromElement('#getFromElement', point, 'scroll');
      deepEqual(this.empty.xval, rObj.scrollLeft + rObj.scrollWidth  - 1, "scroll right of the object should be");
      deepEqual(this.empty.yval, rObj.scrollTop  + rObj.scrollHeight - 1, "scroll bottom of the object should be");
      this.empty.xval = this.empty.yval = -1;

      this.empty.getFromElement('#getFromElement', point, 'css');
      deepEqual(this.empty.xval, parseFloat(jQuery(rObj).css('left')) + parseFloat(jQuery(rObj).css('width'))  - 1, "css right of the object should be");
      deepEqual(this.empty.yval, parseFloat(jQuery(rObj).css('top'))  + parseFloat(jQuery(rObj).css('height')) - 1, "css bottom of the object should be");
      this.empty.xval = this.empty.yval = -1;
   });

   test("getFromElement('center', ...)", function () {
      expect(8);

      var point = 'center', rObj = jQuery('#getFromElement')[0], topleft = new Point2D(), bottomright = new Point2D();
      this.empty.getFromElement('#getFromElement');
      topleft.getFromElement('#getFromElement', 'topleft');
      bottomright.getFromElement('#getFromElement', 'bottomright');
      topleft.add(bottomright).scale(0.5);
      deepEqual(this.empty.xval, rObj.clientLeft + (rObj.clientWidth  - 1) / 2, "client center x of the object should be");
      deepEqual(this.empty.yval, rObj.clientTop  + (rObj.clientHeight - 1) / 2, "client center y of the object should be");
      this.empty.xval = this.empty.yval = -1;

      this.empty.getFromElement('#getFromElement', point, 'offset');
      topleft.getFromElement('#getFromElement', 'topleft', 'offset');
      bottomright.getFromElement('#getFromElement', 'bottomright', 'offset');
      topleft.add(bottomright).scale(0.5);
      deepEqual(this.empty.xval, rObj.offsetLeft + (rObj.offsetWidth  - 1) / 2, "offset center x of the object should be");
      deepEqual(this.empty.yval, rObj.offsetTop  + (rObj.offsetHeight - 1) / 2, "offset center y of the object should be");
      this.empty.xval = this.empty.yval = -1;

      this.empty.getFromElement('#getFromElement', point, 'scroll');
      topleft.getFromElement('#getFromElement', 'topleft', 'scroll');
      bottomright.getFromElement('#getFromElement', 'bottomright', 'scroll');
      topleft.add(bottomright).scale(0.5);
      deepEqual(this.empty.xval, rObj.scrollLeft + (rObj.scrollWidth  - 1) / 2, "scroll center x of the object should be");
      deepEqual(this.empty.yval, rObj.scrollTop  + (rObj.scrollHeight - 1) / 2, "scroll center y of the object should be");
      this.empty.xval = this.empty.yval = -1;

      this.empty.getFromElement('#getFromElement', point, 'css');
      deepEqual(this.empty.xval, parseFloat(jQuery(rObj).css('left')) + (parseFloat(jQuery(rObj).css('width'))  - 1) / 2, "css center x of the object should be");
      deepEqual(this.empty.yval, parseFloat(jQuery(rObj).css('top'))  + (parseFloat(jQuery(rObj).css('height')) - 1) / 2, "css center y of the object should be");
      this.empty.xval = this.empty.yval = -1;
   });

   test("getFromElement('topright', ...)", function () {
      expect(8);

      var point = 'topright', rObj = jQuery('#getFromElement')[0], topleft = new Point2D(), size = new Point2D();
      this.empty.getFromElement('#getFromElement', point);
      topleft.getFromElement('#getFromElement', 'topleft');
      size.getFromElement('#getFromElement', 'size');
      topleft.xval += size.xval - 1;
      deepEqual(this.empty.xval, topleft.xval, "client right of the object should be");
      deepEqual(this.empty.yval, topleft.yval, "client top of the object should be");
      this.empty.xval = this.empty.yval = -1;

      this.empty.getFromElement('#getFromElement', point, 'offset');
      topleft.getFromElement('#getFromElement', 'topleft', 'offset');
      size.getFromElement('#getFromElement', 'size', 'offset');
      topleft.xval += size.xval - 1;
      deepEqual(this.empty.xval, topleft.xval, "offset right of the object should be");
      deepEqual(this.empty.yval, topleft.yval, "offset top of the object should be");
      this.empty.xval = this.empty.yval = -1;

      this.empty.getFromElement('#getFromElement', point, 'scroll');
      topleft.getFromElement('#getFromElement', 'topleft', 'scroll');
      size.getFromElement('#getFromElement', 'size', 'scroll');
      topleft.xval += size.xval - 1;
      deepEqual(this.empty.xval, topleft.xval, "scroll right of the object should be");
      deepEqual(this.empty.yval, topleft.yval, "scroll top of the object should be");
      this.empty.xval = this.empty.yval = -1;

      this.empty.getFromElement('#getFromElement', point, 'css');
      deepEqual(this.empty.xval, parseFloat(jQuery(rObj).css('left')) + parseFloat(jQuery(rObj).css('width')) - 1, "css right of the object should be");
      deepEqual(this.empty.yval + 'px', jQuery(rObj).css('top'), "css top of the object should be");
      this.empty.xval = this.empty.yval = -1;
   });

   test("getFromElement('bottomleft', ...)", function () {
      expect(8);

      var point = 'bottomleft', rObj = jQuery('#getFromElement')[0], topleft = new Point2D(), size = new Point2D();
      this.empty.getFromElement('#getFromElement', point);
      topleft.getFromElement('#getFromElement', 'topleft');
      size.getFromElement('#getFromElement', 'size');
      topleft.yval += size.yval - 1;
      deepEqual(this.empty.xval, topleft.xval, "client left of the object should be");
      deepEqual(this.empty.yval, topleft.yval, "client bottom of the object should be");
      this.empty.xval = this.empty.yval = -1;

      this.empty.getFromElement('#getFromElement', point, 'offset');
      topleft.getFromElement('#getFromElement', 'topleft', 'offset');
      size.getFromElement('#getFromElement', 'size', 'offset');
      topleft.yval += size.yval - 1;
      deepEqual(this.empty.xval, topleft.xval, "offset left of the object should be");
      deepEqual(this.empty.yval, topleft.yval, "offset bottom of the object should be");
      this.empty.xval = this.empty.yval = -1;

      this.empty.getFromElement('#getFromElement', point, 'scroll');
      topleft.getFromElement('#getFromElement', 'topleft', 'scroll');
      size.getFromElement('#getFromElement', 'size', 'scroll');
      topleft.yval += size.yval - 1;
      deepEqual(this.empty.xval, topleft.xval, "scroll left of the object should be");
      deepEqual(this.empty.yval, topleft.yval, "scroll bottom of the object should be");
      this.empty.xval = this.empty.yval = -1;

      this.empty.getFromElement('#getFromElement', point, 'css');
      deepEqual(this.empty.xval + 'px', jQuery(rObj).css('left'),   "css left of the object should be");
      deepEqual(this.empty.yval, parseFloat(jQuery(rObj).css('top'))  + parseFloat(jQuery(rObj).css('height')) - 1, "css bottom of the object should be");
      this.empty.xval = this.empty.yval = -1;
   });

   module("getZoomFactors() - retrieve zoom factors for topleft and size of a 10px x 10px div positioned at 10px, 10px", Setup);
   test("getZoomFactors() - from hidden #zoomindicator div", function () {
      expect(4);

      // Isn't this strange, when you zoom in the page, the reported size of objects is the unzoomed size
      // but the reported position of the object is in zoomed pixels!!
      // Using a hidden div with a box of specific dimensions and top/left position allows detection of Ctrl zooming

      this.empty.getFromElement('#zoomindicator', 'topleft', 'css');
      this.empty.xval /= this.Zoom.topleft.xval;
      this.empty.yval /= this.Zoom.topleft.yval;
      deepEqual(this.empty.toString(), "( 10, 10 )", "logical topleft position should be");

      this.empty.getFromElement('#zoomindicator', 'size', 'css');
      this.empty.xval /= this.Zoom.size.xval;
      this.empty.yval /= this.Zoom.size.yval;
      deepEqual(this.empty.toString(), "( 10, 10 )", "logical size should be");

      deepEqual(this.Zoom.topleft.toString(), this.Zoom.topleft.toString(), "current topleft zoom factor is");
      deepEqual(this.Zoom.size.toString(),    this.Zoom.size.toString(),    "current size zoom factor is");
   });

   module("getLogicalDimensions() - retrieve logical dimensions of an object (unzoomed size)", Setup);
   test("getLogicalDimensions() - from hidden #zoomindicator div will always be (10px,10px) and (10px x 10px)", function () {
      expect(2);

      var Logical = this.empty.getLogicalDimensions('#zoomindicator', this.Zoom);
      deepEqual(Logical.topleft.toString(), "( 10, 10 )", "logical topleft position should be");
      deepEqual(Logical.size.toString(), "( 10, 10 )", "logical size should be");
   });

   module("getZoomedDimensions() - retrieve zoomed dimensions of an object (physical size)", Setup);
   test("getZoomedDimensions() - from hidden #zoomindicator div will always be the same value", function () {
      expect(3);

      var Zoomed = this.empty.getZoomedDimensions('#zoomindicator', this.Zoom);
      deepEqual(Zoomed.topleft.xval, Zoomed.topleft.yval, "zoomed top and left should be");
      deepEqual(Zoomed.size.xval, Zoomed.size.yval, "zoomed width and height should be");

      // At some zoom levels this test will fail as Safari offers some non-symmetric zoom values.
      deepEqual(Zoomed.topleft.xval, Zoomed.size.xval, "zoomed left and width should be");
   });

   module("saveToElement() - set 2D coordinate point of the given DOM element", Setup);
   test("saveToElement() - non-existent element", function () {
      expect(1);

      var point = 'size';
      this.tenTwenty.saveToElement('#object-not-found', point);
      this.tenTwenty.getFromElement('#object-not-found', point);
      deepEqual(this.empty.toString(), "( 0, 0 )", "default if element not found should be");
   });

   test("saveToElement('size') - size of element changed", function () {
      expect(1);

      var point = 'size';
      this.tenTwenty.saveToElement('#saveToElement', point);
      this.empty.getFromElement('#saveToElement', point);
      deepEqual(this.empty.toString(), "( 10, 20 )", "element size now should be");
   });

   test("saveToElement('topleft') - top left posiiton changed", function () {
      expect(4);

      var point = 'topleft',
         Logical = this.empty.getLogicalDimensions('#saveToElement', this.Zoom),
         NewLogical;
      this.data.isCloseEnough(Logical.topleft.xval, 79, this.epsilon, "element left corner should be");
      this.data.isCloseEnough(Logical.topleft.yval, 36, this.epsilon, "element top corner should be");
      Logical.topleft.scale(4);
      Logical.topleft.saveToElement('#saveToElement', point);
      NewLogical = this.empty.getLogicalDimensions('#saveToElement', this.Zoom);

      this.data.isCloseEnough(NewLogical.topleft.xval, 316, this.epsilon, "element left corner now should be");
      this.data.isCloseEnough(NewLogical.topleft.yval, 144, this.epsilon, "element top corner now should be");
   });

   test("saveToElement('center') - position changed by setting center point", function () {
      expect(2);

      var point = 'center', Logical = this.empty.getLogicalDimensions('#targetPoint', this.Zoom), NewLogical;
      this.empty.getPoint(point, Logical.topleft, Logical.size);

      Logical = this.empty.getLogicalDimensions('#saveToElement', this.Zoom);
      this.empty.saveToElement('#saveToElement', point, Logical.size);
      NewLogical = this.tenTwenty.getLogicalDimensions('#saveToElement', this.Zoom);
      this.tenTwenty.getPoint(point, NewLogical.topleft, NewLogical.size);

      this.data.isCloseEnough(this.tenTwenty.xval, 77, this.epsilon, "saved element center xval should be");
      this.data.isCloseEnough(this.tenTwenty.yval, 69, this.epsilon, "saved element center yval should be");
   });

   test("saveToElement('topleft') - position changed by setting topleft to target element", function () {
      expect(2);

      var point = 'topleft', Logical = this.empty.getLogicalDimensions('#targetPoint', this.Zoom), NewLogical;
      this.empty.getPoint(point, Logical.topleft, Logical.size);

      Logical = this.empty.getLogicalDimensions('#saveToElement', this.Zoom);
      this.empty.saveToElement('#saveToElement', point, Logical.size);
      NewLogical = this.tenTwenty.getLogicalDimensions('#saveToElement', this.Zoom);
      this.tenTwenty.getPoint(point, NewLogical.topleft, NewLogical.size);

      this.data.isCloseEnough(this.tenTwenty.xval, 67, this.epsilon, "saved element top xval should be");
      this.data.isCloseEnough(this.tenTwenty.yval, 59, this.epsilon, "saved element left yval should be");
   });

   test("saveToElement('topright') - position changed by setting topright to target element", function () {
      expect(2);

      var point = 'topright', Logical = this.empty.getLogicalDimensions('#targetPoint', this.Zoom), NewLogical;
      this.empty.getPoint(point, Logical.topleft, Logical.size);

      Logical = this.empty.getLogicalDimensions('#saveToElement', this.Zoom);
      this.empty.saveToElement('#saveToElement', point, Logical.size);
      NewLogical = this.tenTwenty.getLogicalDimensions('#saveToElement', this.Zoom);
      this.tenTwenty.getPoint(point, NewLogical.topleft, NewLogical.size);

      this.data.isCloseEnough(this.tenTwenty.xval, 86, this.epsilon, "saved element top xval should be");
      this.data.isCloseEnough(this.tenTwenty.yval, 59, this.epsilon, "saved element right yval should be");
   });

   test("saveToElement('bottomleft') - position changed by setting bottomleft to target element", function () {
      expect(2);

      var point = 'bottomleft', Logical = this.empty.getLogicalDimensions('#targetPoint', this.Zoom), NewLogical;
      this.empty.getPoint(point, Logical.topleft, Logical.size);

      Logical = this.empty.getLogicalDimensions('#saveToElement', this.Zoom);
      this.empty.saveToElement('#saveToElement', point, Logical.size);
      NewLogical = this.tenTwenty.getLogicalDimensions('#saveToElement', this.Zoom);
      this.tenTwenty.getPoint(point, NewLogical.topleft, NewLogical.size);

      this.data.isCloseEnough(this.tenTwenty.xval, 67, this.epsilon, "saved element bottom xval should be");
      this.data.isCloseEnough(this.tenTwenty.yval, 78, this.epsilon, "saved element left yval should be");
   });

   test("saveToElement('bottomright') - position changed by setting bottomright to target element", function () {
      expect(2);

      var point = 'bottomright', Logical = this.empty.getLogicalDimensions('#targetPoint', this.Zoom), NewLogical;
      this.empty.getPoint(point, Logical.topleft, Logical.size);

      Logical = this.empty.getLogicalDimensions('#saveToElement', this.Zoom);
      this.empty.saveToElement('#saveToElement', point, Logical.size);
      NewLogical = this.tenTwenty.getLogicalDimensions('#saveToElement', this.Zoom);
      this.tenTwenty.getPoint(point, NewLogical.topleft, NewLogical.size);

      this.data.isCloseEnough(this.tenTwenty.xval, 86, this.epsilon, "saved element bottom xval should be");
      this.data.isCloseEnough(this.tenTwenty.yval, 78, this.epsilon, "saved element right yval should be");
   });

   module("nudgeElement() - nudge the position of an element slightly by the point value", Setup);
   test("nudgeElement() - nudge up and left a little from top left corner of target", function () {
      expect(2);

      var point = 'topleft', Logical = this.empty.getLogicalDimensions('#targetPoint', this.Zoom), NewLogical;
      this.empty.getPoint(point, Logical.topleft, Logical.size);

      Logical = this.empty.getLogicalDimensions('#saveToElement', this.Zoom);
      this.empty.saveToElement('#saveToElement', point, Logical.size);

      // nudge it slightly off the top left corner
      this.empty.xval = -3;
      this.empty.yval = -5;
      this.empty.nudgeElement('#saveToElement', this.Zoom);

      NewLogical = this.tenTwenty.getLogicalDimensions('#saveToElement', this.Zoom);
      this.tenTwenty.getPoint(point, NewLogical.topleft, NewLogical.size);
      this.data.isCloseEnough(this.tenTwenty.xval, 67 - 3, this.epsilon, "saved element top xval should be");
      this.data.isCloseEnough(this.tenTwenty.yval, 59 - 5, this.epsilon, "saved element left yval should be");
   });

   module("magnitude() - compute the magnitude of the point as if it were a vector", Setup);
   test("magnitude()", function () {
      expect(2);
      deepEqual(this.empty.magnitude(), 0, "origin magnitude should be");
      this.data.isCloseEnough(this.tenTwenty.magnitude(), Math.sqrt(this.tenTwenty.xval * this.tenTwenty.xval + this.tenTwenty.yval * this.tenTwenty.yval), this.epsilon, "computed magnitude should be");
   });

   module("getUnitVector() - compute the unit vector for the point", Setup);
   test("getUnitVector()", function () {
      expect(2);

      var magnitude;
      this.empty = this.tenTwenty.getUnitVector();
      magnitude = this.empty.magnitude();
      this.data.isCloseEnough(this.empty.yval / this.empty.xval, 2, this.epsilon / 100, "unit vector yval/xval ratio should be");
      this.data.isCloseEnough(magnitude, 1, this.epsilon / 100, "unit vector magnitude should be");
   });

   module("applyCeiling() - ensure the magnitude of the point does not exceed the ceiling value", Setup);
   test("applyCeiling()", function () {
      expect(4);

      var magAfter, magnitude = this.tenTwenty.magnitude();
      this.tenTwenty.applyCeiling(40);
      magAfter = this.tenTwenty.magnitude();
      this.data.isCloseEnough(this.tenTwenty.yval / this.tenTwenty.xval, 2, this.epsilon / 100, "vector yval/xval ratio should be");
      this.data.isCloseEnough(magAfter, magnitude, this.epsilon / 100, "vector magnitude below limit should be unchanged");

      this.tenTwenty.applyCeiling(10);
      magnitude = this.tenTwenty.magnitude();
      this.data.isCloseEnough(this.tenTwenty.yval / this.tenTwenty.xval, 2, this.epsilon / 100, "vector yval/xval ratio should be");
      this.data.isCloseEnough(magnitude, 10, this.epsilon / 100, "vector magnitude above limit should be");
   });

   module("applyFloor() - ensure the magnitude of the point does not fall below the floor value", Setup);
   test("applyFloor()", function () {
      expect(4);

      var magAfter, magnitude = this.tenTwenty.magnitude();
      this.tenTwenty.applyFloor(1);
      magAfter = this.tenTwenty.magnitude();
      this.data.isCloseEnough(this.tenTwenty.yval / this.tenTwenty.xval, 2, this.epsilon / 100, "vector yval/xval ratio should be");
      this.data.isCloseEnough(magAfter, magnitude, this.epsilon / 100, "vector magnitude below limit should be unchanged");

      this.tenTwenty.applyFloor(40);
      magnitude = this.tenTwenty.magnitude();
      this.data.isCloseEnough(this.tenTwenty.yval / this.tenTwenty.xval, 2, this.epsilon / 100, "vector yval/xval ratio should be");
      this.data.isCloseEnough(magnitude, 40, this.epsilon / 100, "vector magnitude below limit should be");
   });

   module("dotProduct() - compute the dot product of the point with another point", Setup);
   test("dotProduct()", function () {
      expect(1);
      var dot = this.tenTwenty.dotProduct(this.tenTwenty);
      deepEqual(dot, 400, "dot product should be");
   });

   return this;
};

