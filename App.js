import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  Image,
} from 'react-native';
import Matter from 'matter-js';
import { GameEngine } from 'react-native-game-engine';
import Constants from './Constants';
import Mumu from './Mumu';
import Physics, {resetCorals} from './Physics';
import Floor from './Floor';
import Images from './assets/Images';
import * as Font from 'expo-font';

export default class App extends Component {
  constructor(props) {
    super(props);
    
    this.gameEngine = null;
    this.entities = this.setupWorld();

    this.state = {
      running: true,
      score: 0,
      fontsLoaded: false
    }
  }

  async loadFonts() {
    await Font.loadAsync({
      '04b_19': require('./assets/fonts/04b_19.ttf'),
    })
    this.setState({ fontsLoaded: true });
  }

  componentDidMount(){
    this.loadFonts();
  }

  setupWorld = () => {
    let engine = Matter.Engine.create({ enableSleeping: false });
    let world = engine.world;
    world.gravity.y = 0.0; // gravity of the character set to 0 so it doesnt fall immediately

    let mumu = Matter.Bodies.rectangle(
      Constants.MAX_WIDTH / 2,
      Constants.MAX_HEIGHT / 2,
      Constants.MUMU_WIDTH,
      Constants.MUMU_HEIGHT
    );
    let floor1 = Matter.Bodies.rectangle(Constants.MAX_WIDTH / 2, Constants.MAX_HEIGHT - 25, Constants.MAX_WIDTH, 50, { isStatic: true })

    let floor2 = Matter.Bodies.rectangle( Constants.MAX_WIDTH + (Constants.MAX_WIDTH / 2), Constants.MAX_HEIGHT - 25, Constants.MAX_WIDTH, 50, { isStatic: true })    
    //let ceiling = Matter.Bodies.rectangle( Constants.MAX_WIDTH / 2, 25, Constants.MAX_WIDTH, 50, { isStatic: true })

    Matter.World.add(world, [mumu, floor1, floor2]);
    Matter.Events.on(engine, "collisionStart", (event) => {
      let pairs = event.pairs; // pair of bodies that got collided with

      this.gameEngine.dispatch({ type: "game-over"});
    });

    // adds/renders to the screen
    return { 
      physics: { engine: engine, world: world }, // props for Physics
      mumu: { body: mumu, pose: 1, renderer: Mumu }, // this will do the rendering
      floor1: { body: floor1, renderer: Floor},
      floor2: { body: floor2, renderer: Floor},
    };
  };

  onEvent = (e) => {
    if (e.type === "game-over"){
      this.setState({
        running: false
      })
    } else if (e.type === "score") {
      this.setState({
        score: this.state.score + 1
      })
    }
  }

  reset = () => {
    resetCorals();
    this.gameEngine.swap(this.setupWorld());
    this.setState({
      running: true,
      score: 0
    })
  }

  render() {
    if(this.state.fontsLoaded){
    return (
      <View style={styles.container}>
        <Image source={Images.background} style={styles.backgroundImage} resizeMode="stretch" />
        <GameEngine
          ref={(ref) => {
            this.gameEngine = ref;
          }}
          style={styles.gameContainer}
          entities={this.entities}
          systems = {[Physics]}
          running={this.state.running}
          onEvent={this.onEvent} >
          <StatusBar hidden={true} />
        </GameEngine>       
          <Text style={styles.score}>{this.state.score}</Text>       
        {!this.state.running && <TouchableOpacity onPress={this.reset} style={styles.fullScreenButton}>
          <View style={styles.fullScreen}>
            <Text style={styles.finalScore}> Score: {this.state.score}</Text>
            <Text style={styles.gameOverText}>Game Over</Text>
            <Text style={styles.gameOverSubText}>Try Again</Text>
          </View>
        </TouchableOpacity>}
      </View>
    );
  } else {
      return null;
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: Constants.MAX_WIDTH,
    height: Constants.MAX_HEIGHT
  },
  gameContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },
  fullScreenButton: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flex: 1
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'black',
    opacity: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  score: {
    position: 'absolute',
    color: 'white',
    fontSize: 72,
    top: 50,
    left: Constants.MAX_WIDTH / 2 - 24,
    textShadowColor: '#444444',
    textShadowOffset: { width: 2, height: 2},
    textShadowRadius: 2,
    fontFamily: '04b_19'
  },
  finalScore: {
    position: 'absolute',
    color: 'white',
    fontSize: 48,
    top: 250,
    fontFamily: '04b_19'
  },
  gameOverText: {
    color: 'white',
    fontSize: 48,
    fontFamily: '04b_19'
  },
  gameOverSubText: {
    color: 'white',
    fontSize: 24,
    fontFamily: '04b_19'
  }
});
