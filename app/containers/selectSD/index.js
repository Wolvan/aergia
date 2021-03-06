import React, { Component } from 'react';

import { ipcRenderer } from 'electron';
import { Link, browserHistory } from 'react-router';
import { ScaleLoader } from 'halogen'

import bytes from 'bytes'

import config from '../../config'

import section from '../cssModules/section.scss'
import content from '../cssModules/content.scss'

import styles from './index.css'

// hax for the moment
let folder = require('path').resolve(require('os').tmpdir(), 'aergia')
try {
  require('fs').mkdirSync(folder)
} catch (e) {}

let selectSD = React.createClass({
  getInitialState() {
    return {
      drives: [],
      loading: true
    }
  },
  componentDidMount() {
    ipcRenderer.on('driveListReply', (event, drives) => {
      drives = JSON.parse(drives)
      drives = drives.filter(function (drive) {
        return drive.system === false && drive.protected === false && drive.mountpoints.length
      }).map(function (drive) {
        return {
          description: drive.description,
          mountPoint: drive.mountpoints.length ? drive.mountpoints[0].path : 'Not mounted',
          size: bytes(drive.size)
        }
      })
      this.setState({
        ...this.state,
        loading: false,
        drives
      })
    })
    this.processDrives()
  },
  processDrives () {
    this.setState({
      ...this.state,
      loading: true
    }, function () {
      ipcRenderer.send('driveList')
    })
  },
  getDrives () {
    return this.state.drives.map((drive, i) => {
      return <span className={`${content.button} ${content.buttonKeepText}`} key={drive.mountPoint} onClick={this.setDrive(drive)}>({i+1}) {drive.description} @ {drive.mountPoint} ({drive.size})</span>
    })
  },
  setDrive (drive) {
    return () => {
      config.drive = drive
      this.props.router.push(this.props.location.query.returnTo)
    }
  },
  getContent () {
    let drives = this.getDrives()

    if (this.state.loading) {
      return <div>
        <ScaleLoader color="#000000" width="20px" height="120px" />
        Loading drives...
      </div>
    } else if (drives.length) {
      return <div>
        <h3>Select which SD card you wish to use</h3>
        {drives}
        <br />
        <br />
        <div className={content.button} onClick={this.processDrives}>Refresh</div>
      </div>
    } else {
      return <div>
        Oops, can't detect any valid drives.
        <br />
        <br />
        <div className={content.button} onClick={this.processDrives}>Refresh</div>
      </div>
    }
  },
  render() {
    return (
      <section>
        <h2 className={section.title}>SD Card Selection</h2>
        <div className={`${section.content} ${styles.center}`}>
          {this.getContent()}
          <br />
          <br />
          hacks: <div className={content.button} onClick={this.setDrive({ description: folder, mountPoint: folder })}>use {folder}</div>
        </div>
        <div className={section.navigation}>
          <div className={content.button} onClick={browserHistory.goBack}>Back</div>
        </div>
      </section>
    )
  }
})

export default selectSD
