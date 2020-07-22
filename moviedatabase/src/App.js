import React, { Component, PropTypes, useState, useEffect } from 'react';
import { Text, View} from 'react-native';
import { Button, Form, FormGroup, Input, Label } from 'reactstrap';
import logo from './logo.png';
import './App.css';

import FacebookLogin from 'react-facebook-login';

let data = {};
let picture = '';

class Search extends Component {
  constructor(props) {
    super(props);
    this.keyUped = this.keyUped.bind(this);
    this.keyPressed = this.keyPressed.bind(this);
    this.APIsend = this.APIsend.bind(this);
    this.SaveToStorage = this.SaveToStorage.bind(this);
    this.GetFromStorage = this.GetFromStorage.bind(this);
    this.AddToResultList = this.AddToResultList.bind(this);
    this.SaveToDatabase = this.SaveToDatabase.bind(this);
    this.LoadFromDatabase = this.LoadFromDatabase.bind(this);
    this.state = {Result: [], countResult: 10, date: new Date(), date2: new Date(), diff: 0, APIsend: false };
  }
  SaveToDatabase(id){
    console.log(id);
  }
  LoadFromDatabase(id){
    console.log(id);
  }
  AddToFav = (id,idx) => {
    let favourite = this.state.Result[idx].fav;
    if(favourite==undefined || favourite==false){
      this.state.Result[idx].fav = true;
    }else{
      this.state.Result[idx].fav = false;
    }    
    this.SaveToStorage(this.state.findWord);
    this.SaveToDatabase(id);
  }
  AddToResultList(value) {
    let result = this.state.Result;
    value.fav = false;
    result.push(value);
    this.setState({
      Result: result
    });
  }
  GetFromStorage(value) {
    return JSON.parse(localStorage.getItem(value));
  }
  SaveToStorage(value) {
    value = value.replace(/\s/g, "+");
    let result = this.state.Result;
    result = JSON.stringify(result);
    localStorage.setItem(value, result);    
  }
  APIsend(value,year) {
    if(value.indexOf(' ') >= 0){
      value = value.replace(/\s/g, "+");
    }
    //check storage
    let ResultFromStorage = this.GetFromStorage(value);
    if(ResultFromStorage!=null)
    {
      //console.log(ResultFromStorage);
      this.setState({
        countResult: 0
      });
      this.setState({
        Result: ResultFromStorage
      });
    }else{
      //XMLHttpRequest
      var xhr = new XMLHttpRequest()
      xhr.addEventListener('load', () => {
        //console.log(xhr.responseText);
        var data=xhr.responseText;
        var jsonResponse = JSON.parse(data);
        //console.log(jsonResponse.Response);
        if(jsonResponse.Response=="True"){
          this.setState({
            countResult: this.state.countResult-1
          });
          this.AddToResultList(jsonResponse);
        }      
        if(this.state.countResult>0){
          this.APIsend(value,year-1);
        }else{
          this.SaveToStorage(value);
        }
        if(year<=1895){//first movie lumiere brothers
          this.setState({
            countResult: 0
          });
        }
      })
      xhr.open(
      'GET', 
      'http://www.omdbapi.com/?i=tt3896198&apikey=2c7487e9&t='+value+
      '&plot=full&y='+year
      );
      xhr.send()
    }
  }
  componentDidMount() {
    this.timerID = setInterval(
      () => this.tick(),
      1000
    );
  }
  componentWillUnmount() {
    clearInterval(this.timerID);
  }
  tick() {
    let d = Math.floor(Math.abs(this.state.date2-this.state.date)/1000); 
    this.setState({
      date: new Date(),
      diff: d
    });
    if(this.state.diff>=1){
      //console.log(this.state.findWord);
      if((!this.state.APIsend) && this.state.findWord!='' && this.state.findWord!=undefined){        
        let year=new Date().getFullYear();
        this.APIsend(this.state.findWord,year); 
        this.setState({
          APIsend: true
        });
      }      
    }
  }
  keyPressed(event) {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  }
  keyUped(event) {    
    this.setState({
      date2: new Date(),
      diff: 0,
      APIsend: false,
      findWord: event.target.value.trim(),
      countResult: 10,
      Result: []
    });    
  }
  render() {       
    return(
      <div>
        <Form>
          <FormGroup>
            <Label 
              className="SearchMovieHeader"
              for="exampleMovie">Movie Database</Label>
            <Input 
              type="text" 
              id="exampleMovie" 
              className="SearchMovieInput"
              placeholder="Let's find your movie" 
              onKeyUp={this.keyUped}
              onKeyPress={this.keyPressed}
            />
          </FormGroup>
        </Form>
        <ul className="MovieList">{this.state.Result.map((item, i) => {
          //tu skończyłęm zrobić dodawanie do ulubionych, kartę filmu
          return <li key={i}>
            <div className="MovieItem">
              <div>
                <div style={{color: item.fav ? "tomato" : "ghostwhite" }} className="fav" onClick={()=>this.AddToFav(item.imdbID,i)} >♥</div>
                <img 
                className="MovieItemPoster" 
                src={item.Poster!="N/A" ? item.Poster : logo } 
                />
              </div>
              <div className="MovieItemTitle" >
                <h5>{item.Title} ({item.Year})</h5>
                <h6><b>Director:</b> {item.Director}</h6>
                <h6><b>Genre:</b> {item.Genre}</h6>
                <h6><b>Language:</b> {item.Language}</h6>
                <h6><b>Type:</b> {item.Type}</h6>
              </div>
            </div>
          </li>
        })}</ul>
      </div>
    );
  }
}

class Communicate extends Component {
  constructor(props) {
    super(props);
    this.handler = this.handler.bind(this);
  }
  handler(value){
    this.props.setLogin(value);
  }
  responseFacebook(response)
  {
    //console.log(response);
    data = response;
    picture = response.picture.data.url;
    if (response.accessToken) {
      this.setLogin(true);
      //this.setState({isLoggedIn: true});
    } else {
      this.setLogin(false);
      //this.setState({isLoggedIn: false});
    }/* */
  }  
  render() {
    const fbLoginButton = {
      color: "white",
      backgroundColor: "DodgerBlue",
      padding: "10px",
      fontFamily: "Arial"
    }
    return(
      <View>
        <Text>{this.props.children}</Text>
        <FacebookLogin
          appId="3225165000877581"
          autoLoad={false}
          fields="name,email,picture"
          scope="public_profile"
          callback={this.responseFacebook}
          setLogin={this.handler}
        />
      </View>
    );
  }
}//?

class Entrance extends Component {  
  constructor(props) {
    super(props);
    this.handler = this.handler.bind(this);
  }
  handler(value){
    this.props.setLogin(value);
  }
  render() {
    return(
      <div class="page">
        { this.props.isLoggedIn ? <Search /> : 
        <Communicate setLogin={this.handler}>
          The functionality is only allowed for logged in users
        </Communicate> }
      </div>
    );
  }
}

class AppMain extends Component {
  constructor (props) {
    super(props);
    this.state = {
      isLoggedIn: false,
      step: 0
    };
    this.changeScene = this.changeScene.bind(this);
    this.setLogin = this.setLogin.bind(this);
  }
  setLogin(value){
    this.setState({
      isLoggedIn: value
    });
    //console.log('>> '+this.state.isLoggedIn);
  }
  changeScene() {
    this.setState({
      isLoggedIn: false,
      step: 1
    });
  }  
  render() { 
    return (
      <div>
        <header className="App-header">
            <img 
            src={logo} 
            className = { this.state.step == 1 ? "App-logo App-Nav" : "App-logo" } 
            alt="logo"/>
            { (this.state.step == 0) && <p>
              Welcome to <b>Movie Database</b> <br/>
              America's largest movie database!
            </p>}
            { (this.state.step == 0) && <Button 
            onClick={this.changeScene} 
            color="primary"
            >Next!</Button>}
            { this.state.step == 1 ? <Entrance 
            setLogin={this.setLogin} 
            isLoggedIn={this.state.isLoggedIn}
            /> : null }
        </header>
      </div>
    );
  }
}

function App() {
  return (
    <div className="App">
      <AppMain/>
    </div>
  );
}

export default App;
