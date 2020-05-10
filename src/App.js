import React, { Component } from 'react';
import Particles from 'react-particles-js';
import Navigation from './components/Navigation/Navigation';
import Logo from './components/Logo/Logo';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import Rank from './components/Rank/Rank';
import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import Signin from './components/Signin/Signin';
import Register from './components/Register/Register';
import './App.css';

// configuration for the Particles package.
const particleOptions = {
  particles: {
    number: {
      value: 60,
      density: {
        enable: true,
        value_area: 600
      }
    }
  }
}

const initialState = {
  input: '',
  imageUrl: '',
  box: {},
  route: 'signin',
  isSignedIn: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: ''
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = initialState;
  }

  loadUser = (data) => {
    this.setState({user: {
      id: data.id,
      name: data.name,
      email: data.email,
      entries: data.entries,
      joined: data.joined
    }})
  }

  // uses the fetched data to calculate where to draw a box
  // around the face in the picture.
  calculateFaceLocation = (data) => {
    const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
    const image = document.getElementById('inputimage');
    const width = Number(image.width);
    const height = Number(image.height);
    return {
      leftCol: clarifaiFace.left_col * width,
      topRow: clarifaiFace.top_row * height,
      rightCol: width - (clarifaiFace.right_col * width),
      bottomRow: height - (clarifaiFace.bottom_row * height)
    }
  }

  // defines the this.box property as the inputted data (expecting 
  // it to be the data required to draw a box).
  displayFaceBox = box => {
    this.setState({box: box});
  }

  // Changes this.input as data is added to the input field.
  onInputChange = event => {
    this.setState({input: event.target.value})
  }

  // Defines this.imageUrl as the URL passed to the input field, 
  // sends the data to the face recognition API and gets the response
  // NOTE: the data being passed to the API is actually 'this.state.input' instead of
  // 'this.imageUrl' because, setState() being an asyncronous call, it wouldn't have
  // the time to update the state before the 'predict()' function was called, 
  // leading to an error.
  onPictureSubmit = () => {
    this.setState({ imageUrl: this.state.input })
    fetch('http://localhost:3000/imageurl', {
      method: 'post',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        input: this.state.input
      })
    })
    .then(response => response.json())
    .then(response => {
      if (response) {
        fetch('http://localhost:3000/image', {
          method: 'put',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            id: this.state.user.id
          })
        })
          .then(response => response.json())
          .then(count => {
            // Object.assign() copia todas as propriedades do objeto 'user'
            // e modifica a propriedade 'entries' de acordo.
            this.setState(Object.assign(this.state.user, {entries: count}))
          })
          .catch(console.log);
      }
      this.displayFaceBox(this.calculateFaceLocation(response))
    }) 
    .catch(err => console.log(err));
  }

  // changes route according to login status. 
  onRouteChange = (route) => {
    if (route === 'signout') {
      this.setState(initialState)
    } else if (route === 'home') {
      this.setState({isSignedIn: true})
    }
    this.setState({route: route});
  }

  // renders components according the current route. 
  // If the current route is 'home', it will render the components that
  // compose the home page.
  // Else, it will render either 'signin' or 'register' component.
  render() {
    const { isSignedIn,  imageUrl, route, box } = this.state;
    return (
      <div className='App'>
        <Particles
          className='particles' 
          params={particleOptions}          
        />
        <Navigation 
          isSignedIn={isSignedIn} 
          onRouteChange={this.onRouteChange} />
        { route === 'home'
        ? <div>
          <Logo />
          <Rank 
            name={this.state.user.name} 
            entries={this.state.user.entries} />
          <ImageLinkForm 
            onInputChange={this.onInputChange} 
            onButtonSubmit={this.onPictureSubmit} />
          <FaceRecognition box={box} imageUrl={imageUrl} />
        </div>
        : (
          this.state.route === 'signin' 
          ? <Signin 
              onRouteChange={this.onRouteChange}
              loadUser={this.loadUser} /> 
          : <Register 
              loadUser={this.loadUser} 
              onRouteChange={this.onRouteChange} />
        )
      }  
      </div>
    );
  }
}

export default App;
