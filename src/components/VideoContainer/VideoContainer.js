import React, { Component } from 'react'
import HowToStartVideo from '../../assets/how-to-start.mov'
import HowToJoinVideo from '../../assets/how-to-join.mov'
import HowToCallInVideo from '../../assets/how-to-call-in.mov'
import HowToStartAMeetingVideo from '../../assets/how-to-start-a-meeting.mov'
import './VideoContainer.css'
import NoteContainer from './NoteContainer/NoteContainer'
import { getMeetingNotes } from '../../constants/noteConstants'
import {
  HOW_TO_START_A_MEETING,
  HOW_TO_JOIN_A_MEETING,
  HOW_TO_CALL_IN_TO_A_MEETING,
  HOW_TO_START_IN_CONFERENCE_ROOM
} from '../../constants/videoConstants'

export default class VideoContainer extends Component {
  constructor(props) {
    super(props)
    this.state = {
      notes: [],
    }
  }

  componentDidMount() {
    this.setUpNotes()
  }

  componentWillUnmount() {
    this.video.removeEventListener('timeupdate', this.updateTime.bind(this))
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.video !== nextProps.video) {
      this.resetStateOnPropsChange(nextProps.video)
    }
  }

  resetStateOnPropsChange(video) {
    this.video.removeEventListener('timeupdate', this.updateTime.bind(this))
    this.setUpNotes(video)
  }

  setUpNotes(video) {
    let cleanedVideo
    if (video) {
      cleanedVideo = video.toUpperCase().replace(/-/gi, '_')
    } else {
      cleanedVideo = this.props.video.toUpperCase().replace(/-/gi, '_')
    }
    const noteConstant = `${cleanedVideo}_A_MEETING_NOTES`
    const notes = getMeetingNotes(noteConstant)
    this.setNotes(notes)
  }

  setNotes(notes) {
    this.setState({ notes }, () => {
      this.video.addEventListener('timeupdate', this.updateTime.bind(this))
      this.video.addEventListener('ended', this.resetState.bind(this))
      this.video.playbackRate = 0.75;

      this.playVideo()
    })
  }

  playVideo() {
    if (!this.video.paused) {
      this.video.pause()
    }
    this.video.play()
  }

  resetState() {
    const { notes } = this.state

    this.setState({
      ...this.state,
      notes: notes.map(note => ({...note, selected: false}))
    })
  }

  handleTimeChange() {
    this.updateTime()
  }

  updateTime() {
    const { notes } = this.state
    const { currentTime, paused } = this.video

    const lastNoteTime = notes.slice()
      .sort((a, b) => b.startPoint - a.startPoint)[0].startPoint

    if (currentTime >= lastNoteTime + 1) {
      this.video.currentTime = 0
      return this.resetState()
    }

    if (!paused) {
      const newNotes = notes.map((note, index) => {
        if (currentTime >= note.startPoint && !note.selected) {
          this.video.pause()
          return { ...note, selected: true }
        } else {
          return note
        }
      })

      const stateSelected = this.state.notes.filter(note => note.selected).length
      const newSelected = newNotes.filter(note => note.selected).length

      if (stateSelected !== newSelected) {
        this.setState({
          ...this.state,
          notes: newNotes
        }, () => {
          this.playVideo()
        })
      }
    }
  }

  jumpToLocation(e) {
    const { notes } = this.state
    const { id:message } = e.target
    const note = notes.find(note => note.message === message)
    this.setState({
      ...this.state,
      notes: notes.map(note => ({...note, selected: false}))
    }, () => this.video.currentTime = note.startPoint)
  }

  render() {
    const videos = {
      [HOW_TO_START_A_MEETING]: HowToStartVideo,
      [HOW_TO_JOIN_A_MEETING]: HowToJoinVideo,
      [HOW_TO_CALL_IN_TO_A_MEETING]: HowToCallInVideo,
      [HOW_TO_START_IN_CONFERENCE_ROOM]: HowToStartAMeetingVideo
    }

    return (
      <div className='content-container'>
        <div className='video-container' id='start-video-container'>
          <NoteContainer notes={this.state.notes} onClick={e => this.jumpToLocation(e)}/>
          <video
            playsinline
            id='video'
            src={videos[this.props.video]}
            className='video'
            preload='auto'
            ref={video => this.video = video}
            muted
          />
          <div className='link-to-google'>
            For more information and troubleshooting, please visit <a href='https://gsuite.google.com/learning-center/products/meet/get-started/#section-4'>Google's Hangouts Page</a>
          </div>
        </div>
      </div>
    )
  }
}
