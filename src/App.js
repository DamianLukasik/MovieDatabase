import React, { Component, PropTypes, useState, useEffect } from 'react';
import { Text, View} from 'react-native';
import { Button, Form, FormGroup, Input, Label, Card } from 'reactstrap';
import logo from './logo.png';
import './App.css';

import FacebookLogin from 'react-facebook-login';
import { FaUndo, FaHeart } from 'react-icons/fa';

var Datastore = require('react-native-local-mongodb')

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
    this.ResetData = this.ResetData.bind(this);
    this.RemoveCard = this.RemoveCard.bind(this);
    let db = new Datastore({ filename: 'asyncStorageKey', autoload: true });
    this.state = {Card: null, user: this.props.user, database: db, TotalResults: 0, ActuallPage: 1, Pages: [], Result: [], date: new Date(), date2: new Date(), diff: 0, APIsend: false };
  }
  SaveToDatabase(id,fields,value){
    let userID = this.state.user.id;
    this.state.database.findOne({ _id: userID }, (err, docs) => {
      if(fields=="fav"){
        if(docs==undefined || docs==null){
          let rec = { _id: userID, fav: [id] };
          console.log(this);
          this.state.database.insert(rec, function (err, newDoc) {
            console.log("insert new data");
            console.log(newDoc);
          });/* */
        }else{
          if(value){
            this.state.database.update({ _id: userID }, { $push: { fav: id } }, {}, function () {
              console.log("update data"+id);
            });
          }else{
            this.state.database.update({ _id: userID }, { $pull: { fav: {$in: [id]} } }, {}, function () {
              console.log("update data"+id);
            });
          }          
        }  
      }    
    });   
  }
  LoadFromDatabase(userID,fields){
    this.state.database.findOne({ _id: userID }, (err, docs) => {
      console.log(docs);
      if(fields=="fav"){
        let list = this.state.Result;
        if(docs.fav!=null && docs.fav!=undefined){
          docs.fav.map((idx, i) => { 
            list.map((movie, j) => { 
              if(movie.imdbID==idx){
                movie.fav=true;
              }
            });
          });
        }
        this.setState({
          Result: list,
        });
        this.state.Result.map((movie, k) => { 
          if(movie.fav){
            this.state.Result[k].fav = true;
          }else{
            this.state.Result[k].fav = false;
          }
        });   
        this.SaveToStorage(this.state.findWord);   
      }      
    });
  }
  AddToFav = (id,idx) => {
    let favourite = this.state.Result[idx].fav;
    let log = false;
    if(favourite==undefined || favourite==false){
      log = true;
    }
    this.state.Result[idx].fav = log;
    this.SaveToStorage(this.state.findWord);
    this.SaveToDatabase(id,'fav',log);
    if(this.state.Card!=null){
      if(this.state.Card.imdbID==id){
        this.state.Card.fav=log;
      }
    }    
  }
  ChangePage = (value) => {
    if(value=="next"){
      value = this.state.ActuallPage+1;
    }else if(value=="prev"){
      value = this.state.ActuallPage-1;
    }
    this.state.ActuallPage = value;
    console.log(value+" = "+this.state.ActuallPage);
    this.APIsend(this.state.findWord); 
  }
  ShowCardMovie = (idx,i) => {
    let fav = this.state.Result[i].fav;
    if(this.GetFromStorage(idx,"card",i,fav))
    {
      //XMLHttpRequest
      var xhr = new XMLHttpRequest()
      xhr.addEventListener('load', () => {
        var data=xhr.responseText;
        var jsonResponse = JSON.parse(data);       
        if(jsonResponse.Response=="True"){
          jsonResponse.idxOnList = i;
          jsonResponse.fav = fav;
          this.setState({
            Card: jsonResponse,
          });
          this.SaveToStorage(idx,'card');
        }      
      })
      xhr.open(
      'GET', 
      'http://www.omdbapi.com/?apikey=2c7487e9&i='+idx+'&plot=full'
      );
      xhr.send()
    }else{

    }
  }
  RemoveCard() {
    this.setState({
      Card: null,
    });
    this.APIsend(this.state.findWord.trim());
  }
  AddToResultList(value) {
    let result = this.state.Result;
    if(value.Search!=undefined){
      result = value.Search;
    }
    this.setState({
      Result: result,
      Pages: new Array(Math.floor(value.totalResults/10)).fill(0),
      TotalResults: value.totalResults
    });
    this.LoadFromDatabase(this.state.user.id,'fav');
    console.log(this.state);
  }
  GetFromStorage(value,type="list",i=null,fav=null) {
    let res = null;
    if(type=="list"){    
      res = JSON.parse(localStorage.getItem(value+":"+this.state.ActuallPage));
    }else if(type=="card"){
      res = JSON.parse(localStorage.getItem(value));
    }
    if(res==null || res==undefined){
      return true;
    }
    if(type=="list"){    
      this.setState({
        Result: res.result,
        Pages: new Array(Math.floor(res.totalResults/10)).fill(0),
        TotalResults: res.totalResults,
        ActuallPage: res.actuallPage
      });
    }else if(type=="card"){
      res.idxOnList = i;
      res.fav = fav;
      this.setState({
        Card: res,
      });
    }    
    return false;
  }
  SaveToStorage(value,type="list") {
    if(value.indexOf(' ') >= 0){
      value = value.replace(/\s/g, "+");
    }
    if(type=="list"){
      let result = { result: this.state.Result, totalResults: this.state.TotalResults, actuallPage: this.state.ActuallPage };
      result = JSON.stringify(result);
      localStorage.setItem(value+":"+this.state.ActuallPage, result);  
    }else if(type=="card"){
      localStorage.setItem(value, JSON.stringify(this.state.Card));
    }     
  }
  APIsend(value) {
    if(value.indexOf(' ') >= 0){
      value = value.replace(/\s/g, "+");
    }
    if(this.GetFromStorage(value))
    {
      //XMLHttpRequest
      var xhr = new XMLHttpRequest()
      xhr.addEventListener('load', () => {
        var data=xhr.responseText;
        var jsonResponse = JSON.parse(data);       
        if(jsonResponse.Response=="True"){
          this.AddToResultList(jsonResponse);
        }      
        this.SaveToStorage(value);
      })
      let page = this.state.ActuallPage;
      xhr.open(
      'GET', 
      'http://www.omdbapi.com/?apikey=2c7487e9&s='+value+"&type=movie&page="+page
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
        this.APIsend(this.state.findWord); 
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
    this.ResetData(event.target.value.trim());
  }
  ResetData(findWord){
    this.setState({
      date2: new Date(),
      diff: 0,
      APIsend: false,
      findWord: findWord,
      Result: [],
      TotalResults: 0, 
      ActuallPage: 1, 
      Pages: [],
      Card: null
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
        { this.state.Card!=null ? 
        <div className="Movie">
          <div className="icon" onClick={()=>this.RemoveCard()} ><FaUndo /></div>
          <div>
            <div style={{color:  this.state.Card.fav ? "tomato" : "ghostwhite" }} className="fav fav-large" onClick={()=>this.AddToFav( this.state.Card.imdbID, this.state.Card.idxOnList)} ><FaHeart/></div>
              <img 
                className="MoviePoster" 
                src={ this.state.Card.Poster!="N/A" ?  this.state.Card.Poster : logo } 
              />
            </div>
            <div className="MovieTitle" >
              <h5>{ this.state.Card.Title} ({ this.state.Card.Year})</h5>
              <div style={{ padding: "5px" }}><div class="star-ratings-sprite"><span style={{ width: (10*this.state.Card.imdbRating)+"%" }} class="star-ratings-sprite-rating"></span></div></div>
              {
                Object.keys(this.state.Card).map((key, i) => {
                  let value = this.state.Card[key];
                  if((typeof value === 'string' || value instanceof String) && (value!="N/A" && key!="Website" && key!="idxOnList" && key!="fav" && key!="Response" && key!="Type" && key!="imdbRating" && key!="imdbVotes" && key!="Title" && key!="Year" && key!="Metascore" && key!="Poster" && key!="imdbID")){
                    return <h6 key={i}><b>{key}:</b> { value }</h6>;
                  }
                  //return <h6 key={i}><b>{key}:</b> { val }</h6>;
                })
              }
            </div>
          </div> : 
        <div>
          <ul className="MovieList">{this.state.Result.map((item, i) => {
            //tu skończyłęm zrobić dodawanie do ulubionych, kartę filmu
            return <li key={i}>
              <div className="MovieItem">
                <div>
                  <div style={{color: item.fav ? "tomato" : "ghostwhite" }} className="fav" onClick={()=>this.AddToFav(item.imdbID,i)} ><FaHeart/></div>
                  <img 
                  className="MovieItemPoster" 
                  src={item.Poster!="N/A" ? item.Poster : logo } 
                  />
                </div>
                <div onClick={()=>this.ShowCardMovie(item.imdbID,i)} className="MovieItemTitle" >
                  <h5>{item.Title} ({item.Year})</h5>
                  <h6><b>Type:</b> {item.Type}</h6>
                </div>
              </div>
            </li>
          })}</ul>
          <div class="center">
            <div class="pagination">
              { (this.state.TotalResults!=0 && this.state.ActuallPage>1) ? <li className="noselect" onClick={()=>this.ChangePage("prev")}>&laquo;</li> : null}
              {this.state.Pages.map((page, i) => {
                if(i+1<this.state.ActuallPage && i+1>(this.state.ActuallPage-5)){
                  return <li className="noselect" onClick={()=>this.ChangePage(i+1)}>{i+1}</li>
                }
                return false;
              })}  
              {this.state.Pages.map((page, i) => {
                let max = this.state.ActuallPage+4;
                if(i+1>max || this.state.ActuallPage>i+1){
                  return false;
                }
                return <li className={ (i+1)==this.state.ActuallPage ? "noselect active" : "noselect" } onClick={()=>this.ChangePage(i+1)}>{i+1}</li>
              })}          
              { (this.state.TotalResults!=0 && this.state.ActuallPage<this.state.Pages.length) ? <li className="noselect" onClick={()=>this.ChangePage("next")}>&raquo;</li> : null}
            </div>
          </div>
        </div>
        }
      </div>
    );
  }
}

class Communicate extends Component {
  constructor(props) {
    super(props);
    this.handler = this.handler.bind(this);
  }
  handler(value,res){
    this.props.setLogin(value,res);
  }
  responseFacebook(response)
  {    
    if (response.accessToken) {
      this.setLogin(true,response);
    } else {
      this.setLogin(false,response);
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
  handler(value,res){
    this.props.setLogin(value,res);
  }
  render() {
    return(
      <div class="page">
        { this.props.isLoggedIn ? <div><p className="profile">{this.props.user.name} <img src={this.props.user.picture.data.url}/></p><Search user={this.props.user} /></div> : 
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
      user: null,
      isLoggedIn: false,
      step: 0
    };
    this.changeScene = this.changeScene.bind(this);
    this.setLogin = this.setLogin.bind(this);
  }
  setLogin(value,response){
    this.setState({
      isLoggedIn: value,
      user: response
    });
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
            user={this.state.user}
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
