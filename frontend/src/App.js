import React, { useEffect, useState } from "react";
import logo from './logo.svg';
import './App.css';

// Amplify
import 'bootstrap/dist/css/bootstrap.min.css';
import Amplify,{ Hub } from "@aws-amplify/core";
import { DataStore, Predicates } from "@aws-amplify/datastore";

// Custom
import { Task } from './models';
import awsconfig from './aws-exports';
import { useAuth0 } from "@auth0/auth0-react";

// Components
import LoginButton from './components/LoginButton';
import LogoutButton from './components/LogoutButton';
import Profile from './components/Profile';


Amplify.configure(awsconfig);




async function listTasks(setTasks) {
  const tasks = await DataStore.query(Task, Predicates.ALL);
  setTasks(tasks);
}


function App() {

  const [tasks, setTasks] = useState([]);
  const [name, setName] = useState("");
  const [completed, setCompleted] = useState(false);
  const [id, setId] = useState("");
  const [displayAdd, setDisplayAdd] = useState(true);
  const [displayUpdate, setDisplayUpdate] = useState(false);
  const [displaySearch, setDisplaySearch] = useState(false);

  
  const { user, isAuthenticated } = useAuth0();
  if (isAuthenticated){
    console.log('AppUser:', user);
  }



  async function handleSubmit(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    await DataStore.save(
      new Task({
        name: name,
        completed: completed
      })
    );
    listTasks(setTasks);
    setName("");
  };

  async function handleSearch(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    setDisplaySearch(true);
    const search = await DataStore.query(Task, c => c.task("contains", name));
    setTasks(search);
    setName("");
  }

  async function handleDelete(id) {
    const toDelete = await DataStore.query(Task, id);
    await DataStore.delete(toDelete);
  }

  async function handleSelect(task) {
    setName(task.name);
    setId(task.id);
    setDisplayUpdate(true);
    setDisplayAdd(false);
  }

  async function handleUpdate(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    const original = await DataStore.query(Task, id);
    await DataStore.save(
      Task.copyOf(original, updated => {
        updated.name = name;
        updated.completed = completed;
      })
    );
    listTasks(setTasks);
    setDisplayAdd(true);
    setDisplayUpdate(false);
    setName("");
  }


  useEffect(() => {
    listTasks(setTasks);

    const listener = (data) => {
      if (data.payload.event === "signOut"){
        DataStore.clear();
      }
    }
    Hub.listen('auth', listener);

    const subscription = DataStore.observe(Task).subscribe(msg => {
      listTasks(setTasks);
    });

    const handleConnectionChange = () => {
      const condition = navigator.onLine ? "online" : "offline";
      console.log(condition);
      if (condition === "online") {
        listTasks(setTasks);
      }
    };

    window.addEventListener("online", handleConnectionChange);
    window.addEventListener("offline", handleConnectionChange);

    return () => subscription.unsubscribe();
  }, []);


  return (
    <div className="App">
      <header className="jumbotron jumbotron-fluid bg-dark">
        <img src={logo} className="App-logo" alt="logo" style={{ height: "150px" }}/>
        <LoginButton />
        <LogoutButton />
        <Profile />
      </header>
      <div className="container">
        {displayAdd ? (
          <form>
            <div className="input-group mb-3">
              <input type="text" className="form-control form-control-lg" placeholder="New Task" aria-label="Task" aria-describedby="basic-addon2" value={name} onChange={e => setName(e.target.value)} />
              <div className="input-group-append">
                <button className="btn btn-warning border border-light text-white font-weight-bold" type="button" onClick={e => { handleSubmit(e); }} >
                  Add Task
                </button>
                <button className="btn btn-warning border border-light text-white font-weight-bold" type="button" onClick={e => { handleSearch(e); }} >
                  Search
                </button>
              </div>
            </div>
          </form>
        ) : null}
        {displayUpdate ? (
          <form onSubmit={e => { handleUpdate(e); }} >
            <div className="input-group mb-3">
              <input type="text" className="form-control form-control-lg" placeholder="Update Task" aria-label="Task" aria-describedby="basic-addon2" value={name} onChange={e => setName(e.target.value)} />
              <div className="input-group-append">
                <button className="btn btn-warning text-white font-weight-bold" type="submit" >
                   Update Task
                </button>
              </div>
            </div>
          </form>
        ) : null}
      </div>
      <div className="container">
        {tasks.map((item, i) => {
          return (
            <div className="alert alert-warning alert-dismissible text-dark show" role="alert">
              <span key={item.i} onClick={() => handleSelect(item)}>
                {item.name}
              </span>
              <button key={item.i} type="button" className="close" data-dismiss="alert" aria-label="Close" onClick={() => { handleDelete(item.id); listTasks(setTasks); }} >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
          );
        })}
        {displaySearch ? (
          <button className="button btn-warning float-right text-white font-weight-bold" onClick={() => {setDisplaySearch(false); listTasks(setTasks); }}>
            <span aria-hidden="true">Clear Search</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default App;
