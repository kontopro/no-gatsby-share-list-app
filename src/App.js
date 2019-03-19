import React, { useState } from 'react';
import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
import base, {firebaseApp} from './base';
import hero from './todowide0.jpg'
import icon from './icon.svg'
import './App.css';

export default class App extends React.Component {
  
  state = {
    families: {},
    usr: null
  }

  authenticate = provider => {
    const authProvider = new firebase.auth[`${provider}AuthProvider`]();
    firebaseApp
      .auth()
      .signInWithPopup(authProvider)
      .then(this.authHandler);
  };

  authHandler = async authData => {
    await this.setState({usr: authData.user});
    this.familyRef = base.syncState('/families', {
      context: this,
      state: 'families'
    });
  }

  logout = async () => {
    await firebase.auth().signOut();
    this.setState({ usr: null });
  };

  componentDidMount() {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.authHandler({ user });
      }
    });
  }
  
  componentWillUnmount() {
    base.removeBinding(this.familyRef);
  }

  dropFamily =(familyId) => {
    const families = { ...this.state.families };
    families[`${familyId}`] = null;
    this.setState({ families });
  }

  addFamily =(name,mail) => {
    const families = { ...this.state.families };
    families[`family-${Date.now()}`] = {main:false, name:name, creator:mail, members:[], tasks:{} };
    this.setState({ families });
  }

  updateFamily =(familyId, updatedFamily) => {
    const families = { ...this.state.families };
    families[`${familyId}`] = updatedFamily;
    this.setState({ families });
  }

  render() {
    const user = {...this.state.usr};
    return (
      <div className="site">
            <Header />
            <Home   email={user.email} authenticate={this.authenticate} families={this.state.families} updateFamily={this.updateFamily} addFamily={this.addFamily} dropFamily={this.dropFamily} />
            <Footer name={user.displayName} logout={this.logout} />
        </div>
    );
  }
}

function Header(props) {
  
  return(
    <header>
        <div className='site-logo'>
            <img src={hero} alt='logo of the site' />
        </div>
        <div className='site-title'>
            <h1>my list <span>rocks</span></h1>
        </div>
        
    </header>
  )
}

function Home(props) {

  const [showList, setShow] = useState(null);

  function goHome(e) {
    e.preventDefault();
    setShow(false);
  }

  function updateShow(familyId) {
    setShow(familyId)
  }

  // custom sort because .sort() works only for chrome >69 

  const myFamilies1  = Object.keys(props.families)
                        .filter(x => props.families[x].creator===props.email)
                        .map( x => x);
  const myFamilies2 = Object.keys(props.families)
                        .filter(x => props.families[x].members?props.families[x].members.includes(props.email):null)
                        .map( x => x);
  const myFamilies = [...myFamilies1, ...myFamilies2];                        
  return(
      
      <main className='home'>
          {(showList && props.email)?
          <div className='back-home'>
            <button type='button' onClick={goHome}> 
              <span>&#8592;</span> 
            </button>
          </div>
          :null}
        {!props.email?
          <Login authenticate={props.authenticate} />
          :  
          ((showList && (myFamilies[0])) ?
            <ShoppingList families={props.families} family={props.families[showList]} updateFamily={props.updateFamily} familyId={showList} tasks={props.families[showList].tasks} addTask={props.addTask} updateTask={props.updateTask}/>
            :<MyFamilies  updateShow={updateShow} email={props.email} families={props.families} dropFamily={props.dropFamily} updateFamily={props.updateFamily} addFamily={props.addFamily} myFamilies={myFamilies} />
          )
        }
      </main>
    )
  }
function NewList(props){
  const [name, setName] = useState('');

  function createFamily(e){
    e.preventDefault();
    props.addFamily(name, props.email);
    e.currentTarget.reset();
    setName('');
  }
  
    return(
      <div className='new-list'>
        <p className='card-title'>Δημιουργία Νέας Λίστας</p>
        <div>
          <img src={icon} width="100" alt="a to do list" />
        </div>
        <form onSubmit={createFamily}>
          <label>
            <input autoComplete='off' placeholder='Δώστε Όνομα Λίστας' type='text' name='name' value={name} onChange={(e)=>setName(e.currentTarget.value)}/>
          </label>
          <button disabled={!name} type='submit'>Create List</button>
        </form>
      </div>
    )
}
function Login(props) {
  return (
    <div className='login-welcome'>
      <div className='title'>
        <p>Hey, welcome !</p>
      </div>
      <div className='subtitle'>
        <p>This is an <span>awesome list</span> app</p>
      </div>
      <div>
        <img src={icon} alt='list and share'  width='150'/>
      </div>
      <div className='sign-in'>
        <button type='button' className='google' onClick={() => props.authenticate("Google")}>log in with google</button>
      </div>
    </div>
  )
}

function MyFamilies(props){
  return (
  <div className='my-cards'>
    {props.myFamilies[0]?
      props.myFamilies
        .map(x => (<FamilyCard family={props.families[x]} dropFamily={props.dropFamily} updateFamily={props.updateFamily} updateShow={props.updateShow} key={x} email= {props.email} familyId={x} />))
    :null
    }
      <NewList email={props.email} addFamily={props.addFamily} />
  </div>
  )
}

function FamilyCard(props){

  const [member, setMember] = useState('');
  const isLeader = props.email===props.family.creator;
  function makeDisabled(){
    // true for disabled eg (udesired rules give 1)
    const sum = props.email===member 
                ||
                (props.family.members?props.family.members
                  .map(x => x===member?1:0)
                  .reduce((a,b)=>a+b):0) 
                || member.trim()===''
                // prevent user thinking about specifying two emails divised by comma or space
                || member.trim().includes(' ') || member.trim().includes(',')
                || !member.trim().includes('@')
                || !member.trim().includes('.')
                ;
    return sum;
  }
  
  function createMember(e) {
    e.preventDefault();
    const members = [...props.family.members||[], member.trim()];
    const updatedFamily = {...props.family, members};
    props.updateFamily(props.familyId, updatedFamily);
    e.currentTarget.reset();
    setMember('');
  }

  function leaveFamily(){
    const members = [...props.family.members.filter(x => x!==props.email)];
    const updatedFamily = {...props.family, members};
    props.updateFamily(props.familyId, updatedFamily);
  }

  function handleChangeMember (e) {
    setMember(e.currentTarget.value);
  }

  function visitMe(e){
    e.preventDefault();
    props.updateShow(props.familyId);
  }

  return(
    <div className={`family-card ${isLeader?'mine':null}`}>
      <div className='card-header'>
        <p className='card-title'>{props.family.name}</p>
        <p className='card-subtitle'>(by {props.family.creator})</p>
      </div>
  <div className='card-content'>
      <p className='card-members-title'>Μέλη</p>
      {
        props.family.members?
          props.family.members.map(x => (<Member family={props.family} updateFamily={props.updateFamily} familyId={props.familyId} key={x} emailMember={x} email={props.email} />))
          :<p className='no-members'>δεν υπάρχουν μέλη</p>
      }
    
      {
        props.email===props.family.creator?
            <form className='card-add-member' onSubmit={createMember} >
              <label>Νέο μέλος</label>
              <input type='email' name='member' value={member.trim()} onChange={handleChangeMember} placeholder='προσθήκη email' autoComplete="off" required />
              <div className='card-add-member-btn'>
                <button type='submit' disabled={makeDisabled()} >+</button>
              </div>
            </form>
            :null
      }
      </div>
      <div className='card-footer'>
        {
          props.email===props.family.creator?
          <button className='card-delete' onClick={()=>props.dropFamily(props.familyId)} type='button'>Delete</button>
          :<button className='card-delete' onClick={leaveFamily} type='button'>Leave</button>
        }
        <button className='card-visit' type='button' onClick={visitMe}>View</button>
      </div>
    </div>
  )
}

function Member(props){

  function dropMember(){
    const members = [...props.family.members.filter(x => x!==props.emailMember)];
    const updatedFamily = {...props.family, members:[...members]};
    props.updateFamily(props.familyId, updatedFamily);
  }
  return(
    <div className='card-member'>
      <div className='card-member-email'>
        <p>{props.emailMember}</p>
      </div>
      {props.family.creator===props.email?
      <div className='card-member-del'>
        <button type='button' onClick={dropMember} >✖</button>
      </div>
      :null}
    </div> 
  )

}
 
function ShoppingList(props) {

  const [task, setTask] = useState({name:'', done:false, priority:2, type:1});
  
  function createTask(e) {
    e.preventDefault();
    const tasks ={...props.families[props.familyId].tasks }
    const family = {...props.families[props.familyId],tasks:{...tasks, [`task-${Date.now()}`]:{...task}}};
    const updatedFamily = {...family}
    props.updateFamily(props.familyId, updatedFamily);
    e.currentTarget.reset();
    setTask({name:'', done:false, priority:2, type:1});
  }

  function updateTask(taskId){
    const tasks ={...props.families[props.familyId].tasks }
    const task ={...tasks[taskId] }
    task.done=!task.done;
    const family = {...props.families[props.familyId], tasks:{...tasks, [taskId]:{...task}}};
    const updatedFamily = {...family}
    props.updateFamily(props.familyId, updatedFamily);
  }

  function dropTask(taskId){
    const tasks ={...props.families[props.familyId].tasks }
    tasks[taskId] =null;
    const family = {...props.families[props.familyId], tasks:{...tasks}};
    const updatedFamily = {...family}
    props.updateFamily(props.familyId, updatedFamily);
  }

  function handleInputChange(event) {
    const target = event.target;
    const value  = target.value;
    const name   = target.name;
    setTask({...task, [name]: value});
  }

  return (
          <div className='main-list'>
            <p>{props.family.name}</p>
            <form onSubmit={createTask} >
              <input type='text' name='name' value={task.name} onChange={handleInputChange} autoComplete="off" />
              <button type='submit' disabled={!task.name}>Add</button>
            </form>
          <div className='task-list'>
              
              {props.tasks?
                Object.keys(props.tasks)
                  .filter( 
                      x => !props.tasks[x].done
                      )
                  .map(
                      x => <Task task={props.tasks[x]} taskId={x} key={x} updateTask={updateTask} dropTask={dropTask} />
                    )
                    :null
              }
              {props.tasks?
                Object.keys(props.tasks)
                  .filter( 
                      x => props.tasks[x].done
                      )
                  .map(
                      x => <Task task={props.tasks[x]} taskId={x} key={x} updateTask={updateTask} dropTask={dropTask} />
                    )
                    :null
              }
            </div>
          </div>
  )
}

function Task(props) {

  function handleDone(e) {
    props.updateTask(props.taskId)
  }

    return(
        <div className='task'>
          {props.task.done?
          <label htmlFor={props.taskId} className='task-name task-checked'>
            <button className='task-delete' type='button' onClick={()=>props.dropTask(props.taskId)}>X</button>
            { props.task.name}
          </label>
          :
          <label htmlFor={props.taskId} className='task-name'>{props.task.name}</label>
          }
          <input id={props.taskId} type='checkbox' checked={props.task.done} name='done' onChange={handleDone} />
          <label htmlFor={props.taskId} className='task-mark'>✔</label>
        </div>
    )
}

function Footer(props) {
  return(
    <footer>
        {props.name?
        <div className='user-name'>
          <p>Logged in ( {props.name.split(' ')[0]})
          <button onClick={props.logout}>logout</button>
          </p>
        </div>
        :null
        }
      <div className='title'>
        <p>developed by <span>kontopro</span></p>
      </div>
    </footer>
  )
}
