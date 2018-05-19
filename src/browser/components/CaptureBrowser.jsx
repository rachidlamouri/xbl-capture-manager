import fs from 'fs'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {getClips} from 'browser/redux/actions/clipsActions'
import {setDefaultProfile, setActiveProfile} from 'browser/redux/actions/activeProfileActions'
import {getProfiles} from 'browser/redux/actions/profilesActions'

import Dropdown from 'common/dropdown/Dropdown'
import DropdownOptionConfig from 'common/dropdown/DropdownOptionConfig'
import CapturePreview from 'browser/components/CapturePreview'
import ClipItem from 'browser/components/ClipItem'

class CaptureBrowser extends Component{
    constructor(props){
        super(props)
        
        this.onOption = this.onOption.bind(this)
    }
    render(){
        let {props} = this
        return(
            <div className="capture-browser">
                <CapturePreview/>
                <div className="header">
                    <Dropdown
                        displayText={props.activeGamertag}
                        configList={props.profileConfigList}
                        onOption={this.onOption}
                    />
                </div>
                <div className="clip-items">
                    {props.clips}
                </div>
            </div>
        )
    }
    
    componentDidMount(){
        let {props} = this
        
        props.dispatch(setDefaultProfile())
        props.dispatch(getProfiles())
    }
    onOption(record, label){
        let {props} = this
        props.dispatch(setActiveProfile(record, label))
        props.dispatch(getClips(record.XUID))
    }
    
    static getClipItems(records){
        return records.map((record)=>{
            return(
                <ClipItem
                    key={record.Id}
                    thumbnail={record.thumbnail}
                    clipId={record.Id}
                    dateTaken={record.DateTaken}
                    game={record.GameName}
                    gamertag={record.Gamertag}
                />
            )
        })
    }
    
    static getProfileConfigList(records){
        return records.map((record)=>{
            return new DropdownOptionConfig(record, record.Gamertag)
        })
    }
    
    static mapStateToProps(state){
        return {
            activeGamertag: state.activeProfile.gamertag,
            clips: CaptureBrowser.getClipItems(state.clips.records),
            profileConfigList: CaptureBrowser.getProfileConfigList(state.profiles.records)
        }
    }
}

export default connect(CaptureBrowser.mapStateToProps)(CaptureBrowser)
