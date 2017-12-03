// TODO: add filter/effect to be similar to sevish-droplet?

import React, { Component } from 'react';
import _ from 'lodash';
import {
  BrowserRouter as Router,
  NavLink,
  Route,
} from 'react-router-dom';

import Keyboard from './Keyboard';
import Sequencer from './Sequencer';
import Settings from './Settings';
import {
  getCustomCentsForNote,
  getFrequency,
  getFrequencyFromCents,
  CENTS_IN_OCTAVE
} from './noteHelpers';
import './App.css';

const GAIN_VALUE = 0.1;

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: {
        useCustomCentValues: false,
        customCentValues: _.range(0, CENTS_IN_OCTAVE, 100),
        minFrequency: 220,
        numOctaves: 1,
        numSteps: 12,
        selectedNotes: {},
      },
    };

    this.audioContext = new window.AudioContext();
  }

  getFrequencyForNote = (note) => {
    if (this.state.config.useCustomCentValues) {
      const centValue = getCustomCentsForNote(note, this.state.config.customCentValues);
      return getFrequencyFromCents(this.state.config.minFrequency, centValue);
    } else {
      return getFrequency(
        this.state.config.minFrequency,
        note,
        this.state.config.numOctaves,
        this.state.config.numSteps,
      );
    }
  };

  getStepFrequencies() {
    return _.range(this.state.config.numSteps + 1).map((offset) => {
      const note = this.getNoteFromOffset(offset);
      return this.getFrequencyForNote(note);
    });
  }

  getNoteFromOffset = (offset) => {
    // Notes are a numeric index into the microtone scale.
    // For example, given a standard 12 EDO scale, note 0 corresponds to minFrequency, note 12 corresponds
    // to 1200 cents above minFrequency, etc.
    //
    // Because you can select specific notes to include in the scale with state.config.selectedNotes,
    // we have offset which is slightly different from notes.
    // For example, if selectedNotes == {0, 3, 6}, offset 0 corresponds to note 0, offset 2 corresponds to note 6,
    // and offset 3 corresponds to note 12.
    const sortedNotes = _.sortBy(Object.keys(this.state.config.selectedNotes).map((str) => parseInt(str, 10)));
    const numNotes = sortedNotes.length;
    if (numNotes > 0) {
      const octaves = Math.floor(offset / numNotes);
      const remainder = offset % numNotes;
      return (octaves * this.state.config.numSteps) + sortedNotes[remainder];
    } else {
      return offset;
    }
  };

  setConfig = (config) => {
    this.setState({
      config: Object.assign({}, this.state.config, config),
    });
  };

  render() {
    return (
      {/* TODO: make localhost use /microtonal basename too, or make basename conditional */}
      <Router basename="/microtonal/">
        <div className="m-3">
          <h1>Microtonal</h1>
          <div>A web microtone keyboard</div>

          <div className="my-3">
            <Settings
              config={this.state.config}
              setConfig={this.setConfig}
            />
          </div>

          <ul className="nav nav-tabs">
            <li className="nav-item">
              <NavLink
                to="/"
                className="nav-link"
                activeClassName="active"
                exact
              >
                Keyboard
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/sequencer"
                className="nav-link"
                activeClassName="active"
                exact
              >
                Sequencer
              </NavLink>
            </li>
          </ul>

          <div className="mt-3">
            <Route exact path="/" render={() => (
              <Keyboard
                getNoteFromOffset={this.getNoteFromOffset}
                getFrequencyForNote={this.getFrequencyForNote}
                config={this.state.config}
                audioContext={this.audioContext}
                gain={GAIN_VALUE}
              />
            )} />
            <Route exact path="/sequencer" render={() => (
              <Sequencer
                frequencies={this.getStepFrequencies()}
                gain={GAIN_VALUE}
                audioContext={this.audioContext}
              />
            )} />
          </div>
        </div>
      </Router>
    );
  }
}

export default App;
