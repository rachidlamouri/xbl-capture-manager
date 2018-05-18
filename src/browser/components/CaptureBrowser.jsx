import React, {Component} from 'react'
import {connect} from 'react-redux'
import ClipItem from 'browser/components/ClipItem'
import {getClips} from 'browser/redux/actions'

class CaptureBrowser extends Component{
    render(){
        let {props} = this
        return(
            <div className="capture-browser">
                {props.clips}
            </div>
        )
    }
    
    componentDidMount(){
        let {props} = this
        props.dispatch(getClips())
    }
    
    static getClipItems(records){
        return records.map((record)=>{
            return(
                <ClipItem
                    key={record.Id}
                    thumbnail={record.thumbnail}
                    clipId={record.Id}
                    dateTaken={record.DateTaken}
                />
            )
        })
    }
    
    static mapStateToProps(state){
        return {
            clips: CaptureBrowser.getClipItems(state.clips.records),
        }
    }
}

export default connect(CaptureBrowser.mapStateToProps)(CaptureBrowser)
