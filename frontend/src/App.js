import logo from './logo.svg';
import './App.css';

import 'bootstrap/dist/css/bootstrap.min.css';
import Amplify,{ Hub } from "@aws-amplify/core";
import { DataStore, Predicates } from "@aws-amplify/datastore";

import { Task } from './models';
import awsconfig from './aws-exports';
import { useState } from 'react';

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


  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
