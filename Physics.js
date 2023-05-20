import Matter from 'matter-js';
import CoralTop from './CoralTop';
import CoralBottom from './CoralBottom';

let tick = 0;
let pose = 1;
let corals = 0;

// generates a random number > min and < min+(max-min+1)
export const randomBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min); // even if max-min=0, it's always > min
}

export const resetCorals = () => {
  corals = 0;
}

// generates corals that are GAP_SIZE apart, each with height > than 100 and < half the screen - 100
export const generateCorals = () => {
  let topCoralHeight = randomBetween(100, (Constants.MAX_HEIGHT / 2) - 100);
  let bottomCoralHeight = Constants.MAX_HEIGHT - topCoralHeight - Constants.GAP_SIZE;

  let sizes = [topCoralHeight, bottomCoralHeight];

  if (Math.random() < 0.5){
    sizes = sizes.reverse(); // prevents gap from only appearing in the top half of the screen
  }

  return sizes;
}

export const addCoralsAtLocation = (x, world, entities) => {
  let [coral1Height, coral2Height] = generateCorals();

  let coral1 = Matter.Bodies.trapezoid(
    x,
    coral1Height / 2,
    Constants.CORAL_WIDTH,
    coral1Height,
    1,
    { isStatic: true }
  );

  let coral2 = Matter.Bodies.trapezoid(
    x,
    Constants.MAX_HEIGHT - 50 - (coral2Height / 2),
    Constants.CORAL_WIDTH,
    coral2Height,
    1,
    { isStatic: true }
  );

  Matter.World.add(world, [coral1, coral2]);

  entities["coral" + (corals + 1)] = {
    body: coral1, renderer: CoralTop, scored: false
  }

  entities["coral" + (corals + 2)] = {
    body: coral2, renderer: CoralBottom, scored: false
  }

  corals += 2; // increment number of corals
}

const Physics = (entities, { touches, time, dispatch }) => {
  let engine = entities.physics.engine;
  let mumu = entities.mumu.body;
  let world = entities.physics.world;

// for every touch on the center of the octopus, update the velocity of the octopus (moves up by 0.1 pixels). Only update gravity for the first touch.
  let hadTouches = false;
  touches.filter(t => t.type === "press").forEach(t => {
    if (!hadTouches){
      if (world.gravity.y === 0.0){
        world.gravity.y = 1.2;

        // adds corals 2 and 3 screens away so we have infinite moving corals
        addCoralsAtLocation((Constants.MAX_WIDTH * 2) - (Constants.CORAL_WIDTH / 2), world, entities);
        addCoralsAtLocation((Constants.MAX_WIDTH * 3) - (Constants.CORAL_WIDTH / 2), world, entities);
      }

      hadTouches = true;
      Matter.Body.setVelocity(mumu, { 
        x: mumu.velocity.x, 
        y: -10 
        });
    }
  })

// // moves pipe to the left by 1 unit
// // if the center of the pipe goes off screen, then set its position 2 screens to the right so we have infinite moving pipes
//   for(let i=1; i<=4; i++){
//     if (entities["pipe" + i].body.position.x <= -1 * (Constants.PIPE_WIDTH / 2)){
//       Matter.Body.setPosition(entities["pipe"+i].body, { x: Constants.MAX_WIDTH * 2 - (Constants.PIPE_WIDTH / 2), y: entities["pipe" + i].body.position.y })
//     } else {
//       Matter.Body.translate(entities["pipe" + i].body, { x: -1, y: 0 })
//     }
    
//   }

  Matter.Engine.update(engine, time.delta);

// makes a continuous floor; moves floor 2 pixels left and when one of the floors moves off screen quickly moves it back. Moves corals 2 pixels left
  Object.keys(entities).forEach(key => {
    if(key.indexOf("coral") === 0 && entities.hasOwnProperty(key)){
      Matter.Body.translate(entities[key].body, { x: -2, y: 0});
      if (parseInt(key.replace("coral", "")) % 2 === 0){ // referecnes bottom coral
        if (entities[key].body.position.x <= mumu.position.x && !entities[key].scored){
            entities[key].scored = true;
            dispatch({ type: "score" });
        }

        if (entities[key].body.position.x < -1 * (Constants
        .CORAL_WIDTH / 2)){
          let coralIndex = parseInt(key.replace("coral", "")); // removes the coral from the name then parses an integer
          // detele existing corals
          delete(entities["coral" + (coralIndex - 1)]) // deletes top coral
          delete(entities["coral" + coralIndex]) // deletes bottom coral

          addCoralsAtLocation((Constants.MAX_WIDTH * 2) - (Constants.CORAL_WIDTH / 2), world, entities);
        }
      }
    } else if (key.indexOf("floor") === 0){
      if (entities[key].body.position.x <= -1 * Constants.MAX_WIDTH / 2){
        Matter.Body.setPosition(entities[key].body, { x: Constants.MAX_WIDTH + (Constants.MAX_WIDTH / 2), y: entities[key].body.position.y})
      } else {
        Matter.Body.translate(entities[key].body, { x: -2, y: 0});
      }
    }
  })

  tick += 1;
  if (tick % 5 === 0){
    pose = pose + 1;
    if (pose > 3){
      pose = 1;
    }
    entities.mumu.pose = pose;
  }

  return entities;
}

export default Physics;