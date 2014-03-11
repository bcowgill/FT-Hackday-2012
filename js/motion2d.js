// motion2d.js
// Brent S.A. Cowgill 2012-05-22
// two dimensional motion library. initial motion parameters stored as data- metadata on the elements which will be moved.
// data-velocity-xval, data-velocity-yval
// position and velocity are stored internally as 10000ths of a pixel to prevent rounding error when speeds get close to zero.

/*jslint browser: true, sloppy: true, plusplus: true, maxerr: 1000, indent: 3 */
/*global Motion2D: true, Point2D, alert, window, jQuery, module, test, expect, deepEqual, Data */
/*properties
   Motion2D, attr, getFromElement, hasOwnProperty, jqsel, topleft, getPosition, getVelocity, prototype, typeName,
   METADATA, FINESCALE, toString, Zoom, size, velocity, getZoom, getZoomFactors, val, 'velocity-xval', 'velocity-yval',
   saveVelocity, xval, yval, saveToElement, getLogicalDimensions, scale, move, add, divide, bounceFromWalls, parent,
   LogicalDim, abs, sqrt, unitTests, epsilon, data, empty, css, object, setup, resetZoom, clearOut, printOut,
   acceleration, 'acceleration-xval', 'acceleration-yval', sampleWorld, subtract
*/

if (window.Motion2D) {
   alert("window.Motion2D actually exists.");
}

/*
   Motion2D()

   constructor for two dimensional motion data related to an element on the page
 */
Motion2D = function (jqsel) {
   this.jqsel = jqsel;
   this.topleft = new Point2D();
   this.getPosition();
   this.getVelocity();

   return this;
};

Motion2D.prototype.typeName  = 'Object Motion2D';
Motion2D.prototype.METADATA  = 'velocity-xval,velocity-yval,acceleration-xval,acceleration-yval';
Motion2D.prototype.FINESCALE = 10000;

// toString() - simple conversion to a string for human readability
// produces output: [ #object @( xval, yval ) Vel( xval, yval) Acc( xval, yval) Zoom @( xval, yval ) WxH( xval, yval ) ]
Motion2D.prototype.toString = function (decimals) {
   var zoom = " Zoom @" + this.Zoom.topleft.toString(decimals) + " WxH" + this.Zoom.size.toString(decimals);
   return "[ " + this.jqsel + " @" + this.topleft.toString(decimals) + " Vel" + this.velocity.toString(decimals) + " Acc" + this.acceleration.toString(decimals) + zoom + " ]";
};

// getZoom(jqsel) - update the internal record of the Ctrl + page zoom values
Motion2D.prototype.getZoom = function (jqsel) {
   jqsel = jqsel || '#zoomindicator';
   this.Zoom = this.topleft.getZoomFactors(jqsel);
   return this;
};

// getVelocity() - update the velocity of the object by reading the metadata from the element
Motion2D.prototype.getVelocity = function () {
   var data = new Data();
   data.getFromElement(this.jqsel, this.METADATA);
   this.velocity = new Point2D(data.val['velocity-xval'], data.val['velocity-yval']);
   this.acceleration = new Point2D(data.val['acceleration-xval'], data.val['acceleration-yval']);
   return this;
};

// saveVelocity() - save the velocity back to the metadata on the element
Motion2D.prototype.saveVelocity = function () {
   var data = new Data();
   data.val['velocity-xval'] = this.velocity.xval;
   data.val['velocity-yval'] = this.velocity.yval;
   data.val['acceleration-xval'] = this.acceleration.xval;
   data.val['acceleration-yval'] = this.acceleration.yval;
   data.saveToElement(this.jqsel);
   return this;
};

// getPosition() - update the position of the object by reading the css from the element
Motion2D.prototype.getPosition = function () {
   this.getZoom();
   var LogicalDim = this.topleft.getLogicalDimensions(this.jqsel, this.Zoom);
   this.topleft = LogicalDim.topleft;
   this.topleft.scale(this.FINESCALE);
   return this;
};

// move(maxAcc, maxVel) - move the object by the current velocity and acceleration values
// If the world imposes maximum velocity and acceleration limits, respect them.
Motion2D.prototype.move = function (maxVel, maxAcc) {
   var where;
   this.getZoom();
   this.velocity.add(this.acceleration.applyCeiling(maxAcc)).applyCeiling(maxVel);
   this.topleft.add(this.velocity);

   // Convert from World units to pixels
   where = this.topleft.clone();
   where.divide(this.FINESCALE);

   where.saveToElement(this.jqsel, 'topleft');
   this.saveVelocity();
   return this;
};

// bounceFromWalls() - cause object to bounce off walls of the containing parent element
// elasticity is the proportion of energy kept when the object bounces off the wall
Motion2D.prototype.bounceFromWalls = function (elasticity) {
   elasticity = elasticity || 1;
   this.getZoom();
   var bBounced = false, rJQParent = jQuery(this.jqsel).parent(), size, LogicalDim = this.topleft.getLogicalDimensions(this.jqsel, this.Zoom);
   size = LogicalDim.size.scale(this.FINESCALE);
   LogicalDim = this.topleft.getLogicalDimensions(rJQParent, this.Zoom);
   LogicalDim.size.scale(this.FINESCALE);
   if (this.topleft.xval <= 0) {
      bBounced = true;
      this.velocity.xval = Math.abs(this.velocity.xval);
   }
   if (this.topleft.xval + size.xval >= LogicalDim.size.xval) {
      bBounced = true;
      this.velocity.xval = -Math.abs(this.velocity.xval);
   }
   if (this.topleft.yval <= 0) {
      bBounced = true;
      this.velocity.yval = Math.abs(this.velocity.yval);
   }
   if (this.topleft.yval + size.yval >= LogicalDim.size.yval) {
      bBounced = true;
      this.velocity.yval = -Math.abs(this.velocity.yval);
   }
   if (bBounced) {
      // energy calculation and reduction of velocity
      // save new velocity back to element
      this.velocity.scale(Math.sqrt(elasticity));
      this.saveVelocity();
   }

   return this;
};

//=========================================================================

Motion2D.prototype.sampleWorld = function () {
   var fps, millisecs, animated, falling, fall_nought, elasticity = 0.499999, maxAcc = 10000, maxVel = 100000;

   // set up an animated object bouncing within the #world
   fps = 24;
   millisecs = 1000 / fps;
   animated = new Motion2D('#animated');
   fall_nought  = new Motion2D('#falling');
   falling  = new Motion2D('#falling');

   setInterval(function () {
      var rJQParent, LogicalDim, size, dist, mass = 2000, g_times_m = 40000000000 * mass, data = new Data(), acc = new Point2D(animated.topleft.xval, animated.topleft.yval);

      // Apply a force between the objects
      acc.subtract(falling.topleft);
      dist = Math.sqrt(acc.xval * acc.xval + acc.yval * acc.yval);
      if (dist > 1000) {
         acc.scale(g_times_m).divide(dist * dist * dist);
         falling.acceleration = new Point2D(acc.xval, acc.yval);
         falling.acceleration.add(fall_nought.acceleration);
         acc.scale(-1);
         animated.acceleration = new Point2D(acc.xval, acc.yval);
      }
      // Move the objects
      animated.move(maxVel, maxAcc).bounceFromWalls(elasticity);
      falling.move(maxVel, maxAcc).bounceFromWalls(elasticity);

      // Show motion values for both objects
      data.clearOut();
      data.printOut(animated.toString(2));
      data.printOut(falling.toString(2));
      data.printOut(acc.toString(2));

      // When it stops, give it another kick
      if (Math.abs(animated.velocity.xval) < 3000 && Math.abs(animated.velocity.yval) < 4500) {
         data = animated.velocity.xval;
         animated.velocity.xval *= 3000 + animated.velocity.yval;
         animated.velocity.yval *= 3000 + data;
         animated.move(maxVel, maxAcc);
      }

      // When it's fallen outside the box kick it
      rJQParent = jQuery(falling.jqsel).parent();
      falling.getZoom();
      LogicalDim = falling.topleft.getLogicalDimensions(falling.jqsel, falling.Zoom);
      size = LogicalDim.size.scale(falling.FINESCALE);
      LogicalDim = falling.topleft.getLogicalDimensions(rJQParent, falling.Zoom);
      LogicalDim.size.scale(falling.FINESCALE);
      if ((falling.topleft.xval < 0) && (falling.topleft.yval + size.yval > LogicalDim.size.yval)) {
         data = Math.abs(falling.velocity.xval);
         falling.velocity.xval = Math.abs(falling.velocity.yval) + Math.abs(100 * animated.velocity.yval);
         falling.velocity.yval = -data - Math.abs(100 * animated.velocity.xval);
         falling.move(maxVel, maxAcc);
      }
   }, millisecs);
};

//=========================================================================

Motion2D.prototype.unitTests = function () {
   var Setup = {
      'setup': function () {
         this.epsilon = 2;
         this.data = new Data();
         this.empty = new Motion2D('#nothing');
         jQuery('#object').css('width', '20px').css('height', '20px').css('top', '83px').css('left', '156px').attr('data-velocity-xval', 30000).attr('data-velocity-yval', -50000);
         this.object = new Motion2D('#object');
      },
      'resetZoom': function (Zoom) {
         Zoom.topleft = new Point2D(1, 2);
         Zoom.size = new Point2D(3, 4);
      }
   };

   module("new Motion2D() - returns a new 2D motion object based on some element on the page.", Setup);
   test("new Motion2D() of non-existing element", function () {
      expect(5);

      deepEqual(this.empty.typeName, "Object Motion2D", "motion.typeName should be");
      deepEqual(this.empty.jqsel, '#nothing', "new Motion2D(), motion.jqsel should be");
      deepEqual(this.empty.topleft.toString(), "( 0, 0 )", "new Motion2D(), motion.topleft should be");
      deepEqual(this.empty.velocity.toString(), "( 0, 0 )", "new Motion2D(), motion.velocity should be");
      deepEqual(this.empty.acceleration.toString(), "( 0, 0 )", "new Motion2D(), motion.acceleration should be");
   });

   test("new Motion2D(#object)", function () {
      expect(4);

      deepEqual(this.object.jqsel, '#object', "new Motion2D(), motion.jqsel should be");
      deepEqual(this.object.topleft.toString(), "( 1560000, 830000 )", "new Motion2D(), motion.topleft should be");
      deepEqual(this.object.velocity.toString(), "( 30000, -50000 )", "new Motion2D(), motion.velocity should be");
      deepEqual(this.object.acceleration.toString(), "( -100, 500 )", "new Motion2D(), motion.acceleration should be");
   });

   module("toString() - returns a string representation of 2D motion", Setup);
   test("toString()", function () {
      expect(2);

      // Zoom factor can change so fix it at a given value for testing
      this.resetZoom(this.empty.Zoom);
      this.resetZoom(this.object.Zoom);

      deepEqual(this.empty.toString(), "[ #nothing @( 0, 0 ) Vel( 0, 0 ) Acc( 0, 0 ) Zoom @( 1, 2 ) WxH( 3, 4 ) ]", "empty representation should be");
      deepEqual(this.object.toString(), "[ #object @( 1560000, 830000 ) Vel( 30000, -50000 ) Acc( -100, 500 ) Zoom @( 1, 2 ) WxH( 3, 4 ) ]", "string representation should be");
   });

   module("move() - move the object using the current velocity value", Setup);
   test("move()", function () {
      expect(1);

      this.object.move();
      this.resetZoom(this.object.Zoom);
      deepEqual(this.object.toString(), "[ #object @( 1589900, 780500 ) Vel( 29900, -49500 ) Acc( -100, 500 ) Zoom @( 1, 2 ) WxH( 3, 4 ) ]", "after moved, string representation should be");
   });

   this.sampleWorld();

   return this;
};
