# [Drape](https://gitcdn.xyz/repo/aatishb/drape/master/index.html)
A [fabric design and simulation tool](https://aatishb.com/drape/), built in [three.js](http://threejs.org/).

## Change log
- May 2: added multiple options for pinned constraints, option to avoid cloth self-intersections (very slow!)
- April 27: collision detection speedup (abandoned ray-tracing)
- April 12: improved collision detection, more intuitive GUI controls, made objects transparent
- April 5: added sliders GUI, mouse control (scroll to zoom, drag mouse to change view)
- March 22: added shear & bending springs, collision detection, friction, wireframe view

[TODO](https://github.com/aatishb/drape/issues/8)

## To run online:

You can find the latest version of Drape [here](https://gitcdn.xyz/repo/aatishb/drape/master/index.html)

## To run on your own computer:

If you're interested in developing drape further, you'll want to download the code and run it locally. Here's how to do that:

1. Download code and unzip
2. Easiest way to run: Open one of the .js files with the [p5 editor](http://p5js.org/download/) and press play
3. Alternatively, run the code with a local server (instructions [here](https://github.com/mrdoob/three.js/wiki/How-to-run-things-locally) or [here](https://github.com/processing/p5.js/wiki/Local-server)).

## Credits

Drape is developed by Aatish Bhatia, Demi Fang, Sigrid Adriaenssens, using [three.js](http://threejs.org/) and starting from the [cloth simulation example](http://threejs.org/examples/#webgl_animation_cloth). This work is shared under [the MIT License](https://github.com/aatishb/drape/blob/master/LICENSE).

## More Reading

Some papers that go into the nitty-gritty of cloth simulation.

1. [GPU Ray-Traced Collision Detection for Cloth Simulation](https://hal.inria.fr/hal-01218186/document) (2015)
2. [Ray-traced collision detection for deformable bodies](https://hal.inria.fr/file/index/docid/319404/filename/grapp08.pdf) (2008)
3. [Untangling Cloth](http://graphics.pixar.com/library/UntanglingCloth/paper.pdf) (2003)
4. [Simulation of Clothing with Folds and Wrinkles] (https://graphics.stanford.edu/papers/cloth2003/cloth.pdf) (2003)
5. [Robust Treatment of Collisions, Contact and Friction for Cloth Animation](http://accad.osu.edu/~elaine/intrACCAD/cara/cloth/papers/2002-Bridson.pdf) (2002)
6. [Collision and self collision handling in cloth model dedicated to design garments](https://graphics.stanford.edu/courses/cs468-02-winter/Papers/Collisions_vetements.pdf) (1997)
