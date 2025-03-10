"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Events = void 0;
var Events;
(function (Events) {
    // Fired before MediaSource is attaching to media element
    Events["MEDIA_ATTACHING"] = "hlsMediaAttaching";
    // Fired when MediaSource has been successfully attached to media element
    Events["MEDIA_ATTACHED"] = "hlsMediaAttached";
    // Fired before detaching MediaSource from media element
    Events["MEDIA_DETACHING"] = "hlsMediaDetaching";
    // Fired when MediaSource has been detached from media element
    Events["MEDIA_DETACHED"] = "hlsMediaDetached";
    // Fired when the buffer is going to be reset
    Events["BUFFER_RESET"] = "hlsBufferReset";
    // Fired when we know about the codecs that we need buffers for to push into - data: {tracks : { container, codec, levelCodec, initSegment, metadata }}
    Events["BUFFER_CODECS"] = "hlsBufferCodecs";
    // fired when sourcebuffers have been created - data: { tracks : tracks }
    Events["BUFFER_CREATED"] = "hlsBufferCreated";
    // fired when we append a segment to the buffer - data: { segment: segment object }
    Events["BUFFER_APPENDING"] = "hlsBufferAppending";
    // fired when we are done with appending a media segment to the buffer - data : { parent : segment parent that triggered BUFFER_APPENDING, pending : nb of segments waiting for appending for this segment parent}
    Events["BUFFER_APPENDED"] = "hlsBufferAppended";
    // fired when the stream is finished and we want to notify the media buffer that there will be no more data - data: { }
    Events["BUFFER_EOS"] = "hlsBufferEos";
    // fired when the media buffer should be flushed - data { startOffset, endOffset }
    Events["BUFFER_FLUSHING"] = "hlsBufferFlushing";
    // fired when the media buffer has been flushed - data: { }
    Events["BUFFER_FLUSHED"] = "hlsBufferFlushed";
    // fired to signal that a manifest loading starts - data: { url : manifestURL}
    Events["MANIFEST_LOADING"] = "hlsManifestLoading";
    // fired after manifest has been loaded - data: { levels : [available quality levels], audioTracks : [ available audio tracks ], url : manifestURL, stats : LoaderStats }
    Events["MANIFEST_LOADED"] = "hlsManifestLoaded";
    // fired after manifest has been parsed - data: { levels : [available quality levels], firstLevel : index of first quality level appearing in Manifest}
    Events["MANIFEST_PARSED"] = "hlsManifestParsed";
    // fired when a level switch is requested - data: { level : id of new level }
    Events["LEVEL_SWITCHING"] = "hlsLevelSwitching";
    // fired when a level switch is effective - data: { level : id of new level }
    Events["LEVEL_SWITCHED"] = "hlsLevelSwitched";
    // fired when a level playlist loading starts - data: { url : level URL, level : id of level being loaded}
    Events["LEVEL_LOADING"] = "hlsLevelLoading";
    // fired when a level playlist loading finishes - data: { details : levelDetails object, level : id of loaded level, stats : LoaderStats }
    Events["LEVEL_LOADED"] = "hlsLevelLoaded";
    // fired when a level's details have been updated based on previous details, after it has been loaded - data: { details : levelDetails object, level : id of updated level }
    Events["LEVEL_UPDATED"] = "hlsLevelUpdated";
    // fired when a level's PTS information has been updated after parsing a fragment - data: { details : levelDetails object, level : id of updated level, drift: PTS drift observed when parsing last fragment }
    Events["LEVEL_PTS_UPDATED"] = "hlsLevelPtsUpdated";
    // fired to notify that levels have changed after removing a level - data: { levels : [available quality levels] }
    Events["LEVELS_UPDATED"] = "hlsLevelsUpdated";
    // fired to notify that audio track lists has been updated - data: { audioTracks : audioTracks }
    Events["AUDIO_TRACKS_UPDATED"] = "hlsAudioTracksUpdated";
    // fired when an audio track switching is requested - data: { id : audio track id }
    Events["AUDIO_TRACK_SWITCHING"] = "hlsAudioTrackSwitching";
    // fired when an audio track switch actually occurs - data: { id : audio track id }
    Events["AUDIO_TRACK_SWITCHED"] = "hlsAudioTrackSwitched";
    // fired when an audio track loading starts - data: { url : audio track URL, id : audio track id }
    Events["AUDIO_TRACK_LOADING"] = "hlsAudioTrackLoading";
    // fired when an audio track loading finishes - data: { details : levelDetails object, id : audio track id, stats : LoaderStats }
    Events["AUDIO_TRACK_LOADED"] = "hlsAudioTrackLoaded";
    // fired to notify that subtitle track lists has been updated - data: { subtitleTracks : subtitleTracks }
    Events["SUBTITLE_TRACKS_UPDATED"] = "hlsSubtitleTracksUpdated";
    // fired to notify that subtitle tracks were cleared as a result of stopping the media
    Events["SUBTITLE_TRACKS_CLEARED"] = "hlsSubtitleTracksCleared";
    // fired when an subtitle track switch occurs - data: { id : subtitle track id }
    Events["SUBTITLE_TRACK_SWITCH"] = "hlsSubtitleTrackSwitch";
    // fired when a subtitle track loading starts - data: { url : subtitle track URL, id : subtitle track id }
    Events["SUBTITLE_TRACK_LOADING"] = "hlsSubtitleTrackLoading";
    // fired when a subtitle track loading finishes - data: { details : levelDetails object, id : subtitle track id, stats : LoaderStats }
    Events["SUBTITLE_TRACK_LOADED"] = "hlsSubtitleTrackLoaded";
    // fired when a subtitle fragment has been processed - data: { success : boolean, frag : the processed frag }
    Events["SUBTITLE_FRAG_PROCESSED"] = "hlsSubtitleFragProcessed";
    // fired when a set of VTTCues to be managed externally has been parsed - data: { type: string, track: string, cues: [ VTTCue ] }
    Events["CUES_PARSED"] = "hlsCuesParsed";
    // fired when a text track to be managed externally is found - data: { tracks: [ { label: string, kind: string, default: boolean } ] }
    Events["NON_NATIVE_TEXT_TRACKS_FOUND"] = "hlsNonNativeTextTracksFound";
    // fired when the first timestamp is found - data: { id : demuxer id, initPTS: initPTS, timescale: timescale, frag : fragment object }
    Events["INIT_PTS_FOUND"] = "hlsInitPtsFound";
    // fired when a fragment loading starts - data: { frag : fragment object }
    Events["FRAG_LOADING"] = "hlsFragLoading";
    // fired when a fragment loading is progressing - data: { frag : fragment object, { trequest, tfirst, loaded } }
    // FRAG_LOAD_PROGRESS = 'hlsFragLoadProgress',
    // Identifier for fragment load aborting for emergency switch down - data: { frag : fragment object }
    Events["FRAG_LOAD_EMERGENCY_ABORTED"] = "hlsFragLoadEmergencyAborted";
    // fired when a fragment loading is completed - data: { frag : fragment object, payload : fragment payload, stats : LoaderStats }
    Events["FRAG_LOADED"] = "hlsFragLoaded";
    // fired when a fragment has finished decrypting - data: { id : demuxer id, frag: fragment object, payload : fragment payload, stats : { tstart, tdecrypt } }
    Events["FRAG_DECRYPTED"] = "hlsFragDecrypted";
    // fired when Init Segment has been extracted from fragment - data: { id : demuxer id, frag: fragment object, moov : moov MP4 box, codecs : codecs found while parsing fragment }
    Events["FRAG_PARSING_INIT_SEGMENT"] = "hlsFragParsingInitSegment";
    // fired when parsing sei text is completed - data: { id : demuxer id, frag: fragment object, samples : [ sei samples pes ] }
    Events["FRAG_PARSING_USERDATA"] = "hlsFragParsingUserdata";
    // fired when parsing id3 is completed - data: { id : demuxer id, frag: fragment object, samples : [ id3 samples pes ] }
    Events["FRAG_PARSING_METADATA"] = "hlsFragParsingMetadata";
    // fired when data have been extracted from fragment - data: { id : demuxer id, frag: fragment object, data1 : moof MP4 box or TS fragments, data2 : mdat MP4 box or null}
    // FRAG_PARSING_DATA = 'hlsFragParsingData',
    // fired when fragment parsing is completed - data: { id : demuxer id, frag: fragment object }
    Events["FRAG_PARSED"] = "hlsFragParsed";
    // fired when fragment remuxed MP4 boxes have all been appended into SourceBuffer - data: { id : demuxer id, frag : fragment object, stats : LoaderStats }
    Events["FRAG_BUFFERED"] = "hlsFragBuffered";
    // fired when fragment matching with current media position is changing - data : { id : demuxer id, frag : fragment object }
    Events["FRAG_CHANGED"] = "hlsFragChanged";
    // Identifier for a FPS drop event - data: { currentDropped, currentDecoded, totalDroppedFrames }
    Events["FPS_DROP"] = "hlsFpsDrop";
    // triggered when FPS drop triggers auto level capping - data: { level, droppedLevel }
    Events["FPS_DROP_LEVEL_CAPPING"] = "hlsFpsDropLevelCapping";
    // triggered when maxAutoLevel changes - data { autoLevelCapping, levels, maxAutoLevel, minAutoLevel, maxHdcpLevel }
    Events["MAX_AUTO_LEVEL_UPDATED"] = "hlsMaxAutoLevelUpdated";
    // Identifier for an error event - data: { type : error type, details : error details, fatal : if true, hls.js cannot/will not try to recover, if false, hls.js will try to recover,other error specific data }
    Events["ERROR"] = "hlsError";
    // fired when hls.js instance starts destroying. Different from MEDIA_DETACHED as one could want to detach and reattach a media to the instance of hls.js to handle mid-rolls for example - data: { }
    Events["DESTROYING"] = "hlsDestroying";
    // fired when a decrypt key loading starts - data: { frag : fragment object }
    Events["KEY_LOADING"] = "hlsKeyLoading";
    // fired when a decrypt key loading is completed - data: { frag : fragment object, keyInfo : KeyLoaderInfo }
    Events["KEY_LOADED"] = "hlsKeyLoaded";
    // deprecated; please use BACK_BUFFER_REACHED - data : { bufferEnd: number }
    Events["LIVE_BACK_BUFFER_REACHED"] = "hlsLiveBackBufferReached";
    // fired when the back buffer is reached as defined by the backBufferLength config option - data : { bufferEnd: number }
    Events["BACK_BUFFER_REACHED"] = "hlsBackBufferReached";
    // fired after steering manifest has been loaded - data: { steeringManifest: SteeringManifest object, url: steering manifest URL }
    Events["STEERING_MANIFEST_LOADED"] = "hlsSteeringManifestLoaded";
})(Events || (exports.Events = Events = {}));
