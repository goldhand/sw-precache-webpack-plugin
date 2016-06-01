import React from 'react';
import {createDevTools} from 'redux-devtools';

// Monitors are separate packages, and you can make a custom one
import LogMonitor from 'redux-devtools-log-monitor';
import DockMonitor from 'redux-devtools-dock-monitor';
import SliderMonitor from 'redux-slider-monitor';
import Dispatcher from 'redux-devtools-dispatch';
import MultipleMonitors from 'redux-devtools-multiple-monitors';


// createDevTools takes a monitor and produces a DevTools component
export default createDevTools(
  <DockMonitor toggleVisibilityKey="ctrl-h"
               changePositionKey="ctrl-q"
               changeMonitorKey="ctrl-m"
               defaultPosition="right">
    <MultipleMonitors>
      <LogMonitor theme="nicinabox" />
      <Dispatcher />
    </MultipleMonitors>
    <SliderMonitor keyboardEnabled />
  </DockMonitor>
);
