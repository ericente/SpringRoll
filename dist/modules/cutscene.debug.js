/*! CloudKidFramework 0.0.3 */
!function(){"use strict";var a=function(a){createjs.Container.call(this),this.setup(a)},b=a.prototype=new createjs.Container;b.isReady=!1,b.framerate=0,b.display=null,b.config=null,b.imageScale=1,b.pathReplaceTarg=null,b.pathReplaceVal=null,b._taskMan=null,b._elapsedTime=0,b._clip=null,b._currentAudioInstance=null,b._animFinished=!1,b._audioFinished=!1,b._captionsObj=null,b._loadCallback=null,b._endCallback=null,b.setup=function(a){if(!a)throw new Error("need options to create CreateJSCutscene");this.display="string"==typeof a.display?cloudkid.Application.instance.getDisplay(a.display):a.display,this.config=a.configUrl,this._loadCallback=a.loadCallback||null,this.imageScale=a.imageScale||1,this.pathReplaceTarg=a.pathReplaceTarg||null,this.pathReplaceVal=a.pathReplaceVal||null,this._captionsObj=a.captions||null,this.update=this.update.bind(this),this._audioCallback=this._audioCallback.bind(this),this.resize=this.resize.bind(this),this.display.stage.addChild(this);var b=[];b.push(new cloudkid.LoadTask("config",this.config,this.onConfigLoaded.bind(this))),this._taskMan=new cloudkid.TaskManager(b),this._taskMan.addEventListener(cloudkid.TaskManager.ALL_TASKS_DONE,this.onLoadComplete.bind(this)),this._taskMan.startAll()},b.onConfigLoaded=function(a){this.config=a.content,this._captionsObj&&this._captionsObj.setDictionary(this.config.captions),this.framerate=this.config.settings.fps;var b=[];b.push({id:"clip",src:this.config.settings.clip});for(var c in this.config.images){var d=this.pathReplaceTarg?this.config.images[c].replace(this.pathReplaceTarg,this.pathReplaceVal):this.config.images[c];b.push({id:c,src:d})}var e=this.config.audio;cloudkid.Sound.instance.loadConfig(e),this._taskMan.addTask(new cloudkid.ListTask("art",b,this.onArtLoaded.bind(this))),this._taskMan.addTask(cloudkid.Sound.instance.createPreloadTask("audio",[e.soundManifest[0].id],this.onAudioLoaded))},b.onAudioLoaded=function(){},b.onArtLoaded=function(a){window.images||(window.images={});var b,c={},d={};for(b in a){var e=a[b].content;if(0===b.indexOf("atlasData_"))c[b.replace("atlasData_","")]=e;else if(0===b.indexOf("atlasImage_"))d[b.replace("atlasImage_","")]=e;else if("clip"==b){if(1!=this.imageScale){var f=this.imageScale;for(var g in this.config.images)createjs.BitmapUtils.replaceWithScaledBitmap(g,f)}}else images[b]=e}for(b in c)c[b]&&d[b]&&createjs.BitmapUtils.loadSpriteSheet(c[b].frames,d[b],this.imageScale)},b.onLoadComplete=function(){this._taskMan.removeAllEventListeners(),this._taskMan.destroy(),this._taskMan=null;var a=this._clip=new lib[this.config.settings.clipClass];this._clip.timeline&&1!=this._clip.timeline.duration||(a=this._clip.getChildAt(0)),a.mouseEnabled=!1,a.framerate=this.framerate,a.advanceDuringTicks=!1,a.gotoAndPlay(0),a.loop=!1,this.addChild(this._clip),this.resize(this.display.width,this.display.height),cloudkid.Application.instance.on("resize",this.resize),this.isReady=!0,this._loadCallback&&(this._loadCallback(),this._loadCallback=null)},b.resize=function(a,b){if(this._clip){var c=b/this.config.settings.designedHeight;this._clip.scaleX=this._clip.scaleY=c,this.x=.5*(a-this.config.settings.designedWidth*c),this.isReady&&this.display.paused&&(this.display.paused=!1,this.display.render(0),this.display.paused=!0)}},b.start=function(a){this._endCallback=a,this._timeElapsed=0,this._animFinished=!1,this._audioFinished=!1;var b=this.config.audio.soundManifest[0].id;this._currentAudioInstance=cloudkid.Sound.instance.play(b,this._audioCallback),this._captionsObj&&this._captionsObj.run(b),cloudkid.Application.instance.on("update",this.update)},b._audioCallback=function(){this._audioFinished=!0,this._currentAudioInstance=null,this._animFinished&&this.stop(!0)},b.update=function(a){if(!this._animFinished){if(this._currentAudioInstance){var b=.001*this._currentAudioInstance.position;0===this._timeElapsed&&b>2*a||this._currentAudioInstance&&(this._timeElapsed=.001*this._currentAudioInstance.position)}else this._timeElapsed+=.001*a;this._captionsObj&&this._captionsObj.seek(1e3*this._timeElapsed);var c=this._clip.timeline&&1!=this._clip.timeline.duration?this._clip:this._clip.getChildAt(0);c.elapsedTime=this._timeElapsed,c.currentFrame==c.timeline.duration&&(this._animFinished=!0,this._audioFinished&&this.stop(!0))}},b.stop=function(a){cloudkid.Application.instance.off("update",this.update),this._currentAudioInstance&&cloudkid.Sound.instance.stop(this.config.audio.soundManifest[0].id),this._captionsObj.stop(),a&&this._endCallback&&(this._endCallback(),this._endCallback=null)},b.destroy=function(){cloudkid.Application.instance.off("resize",this.resize),this.removeAllChildren(!0),cloudkid.Sound.instance.unload([this.config.audio.soundManifest[0].id]),this.config=null,this._taskMan&&(this._taskMan.removeAllEventListeners(),this._taskMan.destroy(),this._taskMan=null),this._currentAudioInstance=null,this._loadCallback=null,this._endCallback=null,this._clip=null,this._captionsObj=null,this.display.stage.removeChild(this),this.display=null},namespace("cloudkid").CreateJSCutscene=a}();