import fs from 'fs'
import classNames from 'classNames'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import {getClips, getMaxPages, setPage, decrementPage, incrementPage} from 'browser/redux/actions/clipsActions'
import {setDefaultProfile, setActiveProfile} from 'browser/redux/actions/activeProfileActions'
import {getProfiles} from 'browser/redux/actions/profilesActions'

import Dropdown from 'common/dropdown/Dropdown'
import DropdownOptionConfig from 'common/dropdown/DropdownOptionConfig'
import CapturePreview from 'browser/components/CapturePreview'
import ClipItem from 'browser/components/ClipItem'

class CaptureBrowser extends Component{
    constructor(props){
        super(props)
        
        this.decrementPage = this.decrementPage.bind(this)
        this.incrementPage = this.incrementPage.bind(this)
        this.onOption = this.onOption.bind(this)
        this.onRefresh = this.onRefresh.bind(this)
    }
    render(){
        let {props} = this
        
        let pageControlsClasses = classNames('page-controls', {
            hidden: props.clipsCount == 0,
        })
        
        let pageDownClasses = classNames('fas fa-arrow-left page-down', {
            disabled: props.currentPage == 1,
        })
        
        let pageUpClasses = classNames('fas fa-arrow-right page-up', {
            disabled: props.currentPage == props.maxPages,
        })
        
        let noCapturesMessageClasses = classNames({
            hidden: props.clipsCount > 0,
        })
        
        return(
            <div className="capture-browser">
                <CapturePreview/>
                <div className="header">
                    <Dropdown
                        displayText={props.activeGamertag}
                        configList={props.profileConfigList}
                        onOption={this.onOption}
                    />
                    <i className="fas fa-sync-alt" onClick={this.onRefresh}></i>
                </div>
                <div className="clip-items">
                    {props.clips}
                    <div className={pageControlsClasses}>
                        <i className={pageDownClasses} onClick={this.decrementPage}/>
                        <div className="space"/>
                        <i className={pageUpClasses} onClick={this.incrementPage}/>
                    </div>
                    <div className={noCapturesMessageClasses}>No captures archived.</div>
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
        
        props.dispatch(setPage(1))
        props.dispatch(setActiveProfile(record, label))
        props.dispatch(getMaxPages())
    }
    onRefresh(event){
        let {props} = this
        props.dispatch(setPage(1))
        props.dispatch(getMaxPages())
    }
    decrementPage(event){
        let {props} = this
        props.dispatch(decrementPage())
    }
    incrementPage(event){
        let {props} = this
        props.dispatch(incrementPage())
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
            currentPage: state.clips.page,
            maxPages: state.clips.maxPages,
            profileConfigList: CaptureBrowser.getProfileConfigList(state.profiles.records),
            clipsCount: state.clips.records.length,
        }
    }
}

export default connect(CaptureBrowser.mapStateToProps)(CaptureBrowser)
