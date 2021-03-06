import React from 'react';
import _ from 'lodash';
import {
  BrowserRouter as Router,
  Route,
} from 'react-router-dom';
import './App.css';
import Composer from './Composer';
import Footer from './Footer';
import Header from './Header';
import Keyboard from './Keyboard';
import Settings from './Settings';
import Tutorial from './Tutorial';
import {
  getCustomCentsForNote,
  getFrequency,
  getFrequencyFromCents,
  CENTS_IN_OCTAVE
} from './noteHelpers';

const GAIN_VALUE = 0.1;

function SettingsWrapper(props) {
  return (
    <div className="container">
      <div className="my-3">
        <Settings
          config={props.config}
          setConfig={props.setConfig}
        />
      </div>

      <div className="mt-3">
        {props.children}
      </div>
    </div>
  );
}

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      config: {
        useCustomCentValues: false,
        // TODO: make this be in sync with CustomSettings preset
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
      <Router>
        <div>
          <Header />
          <Route exact path="/" render={() => (
            <SettingsWrapper config={this.state.config} setConfig={this.setConfig}>
              <Keyboard
                getNoteFromOffset={this.getNoteFromOffset}
                getFrequencyForNote={this.getFrequencyForNote}
                config={this.state.config}
                audioContext={this.audioContext}
                gain={GAIN_VALUE}
              />
            </SettingsWrapper>
          )} />
          <Route exact path="/composer" render={() => (
            <SettingsWrapper config={this.state.config} setConfig={this.setConfig}>
              <Composer
                frequencies={this.getStepFrequencies()}
                gain={GAIN_VALUE}
                audioContext={this.audioContext}
              />
            </SettingsWrapper>
          )} />
          <Route exact path="/tutorial" component={Tutorial} />
          <Footer className="mt-3" />
        </div>
      </Router>
    );
  }
}

export default App;
