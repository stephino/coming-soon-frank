/**
 * jQuery StoryLine Plugin
 * 
 * @author Valentino-Jivko Radosavlevici <valentino@radosavlevici.com>
 * @copyright 2013 RJV Creations Corp
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy 
 * of this software and associated documentation files (the "Software"), to deal 
 * in the Software without restriction, including without limitation the rights 
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
 * copies of the Software, and to permit persons to whom the Software is 
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in 
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
 * SOFTWARE.
 */
jQuery && jQuery.extend({
    storyline: function(o) {
        var $ = jQuery,
            undefined,
            global = {},
            message = {error:{},status:{},const:{}},
            logLevel = {debug:'Debug',info:'Info ',error:'Error'},
            options = $.extend({
                frames: {},
                frameTop: 0,
                guide: false,      
                buildMenu: false,
                menuSpeed: 1500,
                menuTarget: 'body',
                menuParent: false,
                tolerance: 0,
                ignoreWarnings: true,
                goToActions: {},
            },o);
        
        // Errors
        message.error.singleton = 'Singleton. The storyline method can only be used once.';
        message.error.frames = 'The <frames> option must be an object.';
        message.error.guide = 'The <guide> option must be a boolean.';
        message.error.tolerance = 'The <tolerance> option must be an integer.';
        message.error.buildMenu = 'The <buildMenu> option must be either false or an array.';
        message.error.menuSpeed = 'The <menuSpeed> option must be an integer.';
        message.error.goToFrame_invalidFrame = 'goToFrame - Invalid frame name.';
        message.error.goToFrame_invalidPosition = 'goToFrame - Invalid frame position.';
        message.error.goToFrame_invalidObject = 'goToFrame - Invalid frame object.';
        message.error.goToFrame_menuItemNotFound = 'goToFrame - Menu item not found';
        message.error.storyMenuCreate_noItems = 'storyMenuCreate - No items to append to the menu.';
        message.error.buildMenu_notSet = '<buildMenu> name not set for frame #__no__. Using the default instead.';
        message.error.storyFrame_elementNotFound = 'storyFrame: Invalid frame. Element "__name__" not found.';
        message.error.storyFrame_notValid = 'storyFrame: Invalid frame. Element "__element__" does not have a valid function of function object assigned.';
        message.error.needsRefresh = 'Properties need to be reset. Scroll from __start__ to __end__ and back in __time__ miliseconds.';
        message.error.invalidContent = 'Invalid content. The page must have a vertical scroll bar.';
        // Status messages
        message.status.setOptions = 'Set options:';
        message.status.storyMenuCreate_init = 'storyMenuCreate - Before.';
        message.status.storyMenuCreate_end = 'storyMenuCreate - After.';
        message.status.storyGuideCreate_init = 'storyGuideCreate - Before.';
        message.status.storyGuideCreate_end = 'storyGuideCreate - After.';
        message.status.storyFrame_init = 'storyFrame "__u__" - Before.';
        message.status.storyFrame_end = 'storyFrame "__u__" - After.';
        message.status.frameTopOverwritten = 'The <frameTop> was overwritten to adapt to the guide menu.';
        // Constants
        message.const.storyline = 'Storyline';
        message.const.logLevel = logLevel.debug;
        message.const.refreshAfter = 200;
        message.const.dataTargetFrame = 'targetFrame';
        message.const.dataFrameInfo = 'frameInfo';
        message.const.dataFrameName = 'frameName';
        message.const.dataFramePosition = 'framePosition';
        message.const.frameNumber = 'Frame #';
        message.const.menuClass = 'storyline-menu';
        message.const.menuItemClass = 'storyline-menu-item';
        
        // Set a console logger
        var log = (console.log !== 'undefined' && options.guide)
            ?
            function(m,l){
                if (undefined === l) l = logLevel.debug;
                var logIndexCurrent = 0;
                var logIndexAllowed = 0;
                var logIndexIterator = 0;
                var textColors = ['#FFFFFF','#00FFFF','#FF5555'];
                var textColor = '';
                $.each(logLevel,function(k,v){
                    if (v === l) {
                        logIndexCurrent = logIndexIterator;
                        textColor = textColors[logIndexIterator];
                    }
                    if (v === message.const.logLevel) {
                        logIndexAllowed = logIndexIterator;
                    }
                    logIndexIterator ++;
                });
            
                if(logIndexCurrent < logIndexAllowed) return false;
                switch(l) {
                    case logLevel.debug:
                        console.log(message.const.storyline + ': ', m);
                        break;
                    case logLevel.info:
                        if (undefined !== console.info) {
                            console.info(message.const.storyline + ': ', m);
                        } else {
                            console.log(message.const.storyline + '[' + l + ']: ', m);
                        }
                        break;
                    case logLevel.error:
                        if (undefined !== console.error) {
                            console.error(message.const.storyline + ': ', m);
                        } else {
                            console.log(message.const.storyline + '[' + l + ']: ', m);
                        }
                        break;
                }
                
                if (options.guide) {
                    if (undefined === global.guideConsole) {
                        global.guideConsole = $(
                            '<div style="'
                                + 'background: none repeat scroll 0 0 rgba(0,0,0,0.9);'
                                + 'bottom: 100px;'
                                + 'color: #FFFFFF;'
                                + 'font-family: monospace;'
                                + 'font-size: 12px;'
                                + 'line-height: 14px;'
                                + 'padding: 4px;'
                                + 'position: fixed;'
                                + 'right: 25px;'
                                + 'width: 25%;'
                                + 'z-index: 10001;'
                                + 'overflow-x: hidden;'
                                + 'overflow-y: auto;'
                                + 'word-wrap: break-word;'
                                + 'min-height: 20px;'
                                + 'max-height: 200px;'
                            + '"><b style="text-transform:uppercase;">' 
                                + message.const.storyline 
                                + ' log</b><br/></div>'
                        );
                        $('body').append(global.guideConsole);
                    }

                    global.guideConsole.html(
                        global.guideConsole.html()
                        + '<b style="color: ' + textColor + ';">&amp;&gt;</b>&nbsp;<span style="color: ' + textColor + ';">'
                        + (typeof m !== 'string' ? JSON.stringify(m) : '<i>' + m.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>') + '</i>')
                        + '</span><br/>'
                    );
                }
                return false;
            }
            :
            function(){return false;};

        // Get an object size
        var sizeof = function(o) {if (typeof o === 'object') {var size = 0;for (i in o) {if (o.hasOwnProperty(i)) {size++;}}return size;} else {return 0;}};

        // Set the ignoreWarnings option
        if (typeof options.ignoreWarnings !== 'boolean') {
            options.ignoreWarnings = true;
        }

        // Only use once
        if (typeof global.storylineScroll !== 'undefined') {
            return log(message.error.singleton, logLevel.error);
        }

        // Any frames?
        if (sizeof(options.frames) === 0) {
            return log(message.error.frames, logLevel.error);
        }

        // Valid guide option?
        if (typeof options.guide !== 'boolean') {
            options.guide = true;
            log(message.error.guide, logLevel.error);
        }

        // Valid tolerance option?
        if (typeof options.tolerance !== 'number') {
            log(message.error.tolerance, logLevel.error);
            if (!options.ignoreWarnings) { 
                return false;
            } else {
                options.tolerance = 20;
            }
        } else {
            options.tolerance = Math.abs(parseInt(options.tolerance));
        }

        // Valid buildMenu option?
        if (options.buildMenu !== false && typeof options.buildMenu !== 'object') {
            log(message.error.buildMenu, logLevel.error);
            if (!options.ignoreWarnings) { 
                return false;
            } else {
                options.buildMenu = false;
            }
        }

        // Valid menuSpeed option?
        if (typeof options.menuSpeed !== 'number') {
            log(message.error.menuSpeed, logLevel.error);
            if (!options.ignoreWarnings) { 
                return false;
            } else {
                options.menuSpeed = 1500;
            }
        } else {
            options.menuSpeed = Math.abs(parseInt(options.menuSpeed));
        }

        // Log available options
        log(message.status.setOptions, logLevel.info);
        var logOptions = $.extend({}, options);
        delete logOptions.frames;
        log(logOptions, logLevel.info);

        // Set globally used variables
        $.extend(global, {
            // Get the window width and height
            screenHeight: $(window).height(),
            screenWidth: $(window).width(),
            documentHeight: $('body').outerHeight(true),
            
            // Ready for actions
            readyForActions: false,
            
            // Set the frame iterator
            frameIterator: 1,

            // Store the frames active states
            frameActiveStates: {},
            frameCenterStates: {},

            // Store the frames heights
            frameHeights: {},

            // Create the frame list
            frameList: {},

            // Set the story guide object
            storyGuideObject: null,

            // Store the menu object
            storyLineMenu: null,

            // Store the moste visible frame
            mostVisibleFrame: null,
            mostVisibleFrameV: null,

            // Set a list of tools for each frame
            frameTools: {
                goToFrame: function(frame,d,s) {
                    var delay = typeof d !== 'numeric' ? options.menuSpeed : d;
                    var scroll = typeof s !== 'boolean' ? true : s;
                    var targetFrame = null;
                    var foundTargetFrame = null;
                    switch (typeof frame) {
                        case 'string':
                            $.each(global.frameList,function(k,v){
                                if (typeof $(v).data(message.const.dataFrameInfo) !== 'undefined' && $(v).data(message.const.dataFrameInfo)[message.const.dataFrameName] === frame) {
                                    foundTargetFrame = $(v);
                                    return false;
                                }
                            });
                            if (null !== foundTargetFrame) {
                                targetFrame = foundTargetFrame;
                            } else {
                                log(message.error.goToFrame_invalidFrame + ' "' + frame + '".', logLevel.error);
                            }
                            
                            break;
                        case 'number':
                            $.each(global.frameList,function(k,v){
                                if (typeof $(v).data(message.const.dataFrameInfo) !== 'undefined' && $(v).data(message.const.dataFrameInfo)[message.const.dataFramePosition] === frame) {
                                    foundTargetFrame = $(v);
                                    return false;
                                }
                            });
                            if (null !== foundTargetFrame) {
                                targetFrame = foundTargetFrame;
                            } else {
                                log(message.error.goToFrame_invalidPosition + ' "' + frame + '".', logLevel.error);
                            }

                            break;
                        case 'object':
                            if (typeof $(frame).data(message.const.dataFrameInfo) !== 'undefined') {
                                targetFrame = frame;
                            } else {
                                log(message.error.goToFrame_invalidObject, logLevel.error);
                            }
                            
                            break;
                        default:
                            log(message.error.goToFrame_invalidFrame, logLevel.error);
                            break;
                    }

                    // Scroll to element
                    if (null !== targetFrame) {
                        // Defined a position
                        if ("function" === typeof options.frames[targetFrame.data(message.const.dataFrameInfo).frameSelector].onGoTo) {
                            options.frames[targetFrame.data(message.const.dataFrameInfo).frameSelector].onGoTo.call(targetFrame);
                        }
                        
                        if (scroll) {
                            if($(window).scrollTop() !== $(targetFrame).offset().top - global.menuHeight) {
                                var scrollTo = $(targetFrame).offset().top - global.menuHeight;
                                if (scrollTo >= options.frameTop) {
                                    scrollTo -= options.frameTop;
                                }
                                $('html,body').stop().animate({
                                    scrollTop: scrollTo
                                }, delay);
                            }
                        }

                        // Update the menu
                        if (options.buildMenu && null !== global.storyLineMenu) {
                            var foundCorrespondent = false;
                            $.each(global.storyLineMenu.children(), function(k,v){
                                if (typeof $(v).data(message.const.dataTargetFrame) === 'object') {
                                    if ($(v).data(message.const.dataTargetFrame).data(message.const.dataFrameInfo) === $(targetFrame).data(message.const.dataFrameInfo)) {
                                        $.each($(global.storyLineMenu).children(), function(k){
                                            if (k+1 != global.mostVisibleFrame && $(this).hasClass('active')) {
                                                $(this).removeClass('active').trigger('cssClassChanged');
                                            }
                                        });
                                        if (!$(v).hasClass('active')) {
                                            $(v).addClass('active').trigger('cssClassChanged');
                                        }
                                        
                                        if (options.guide) {
                                            $(global.storyLineMenu).children().attr('title','.' + message.const.menuItemClass);
                                            $(v).attr('title', '.' + message.const.menuItemClass + '.active');
                                        }
                                        foundCorrespondent = true;
                                        return false;
                                    }
                                }
                            });

                            if (!foundCorrespondent) {
                                log(message.error.goToFrame_menuItemNotFound, logLevel.error);
                            }
                            global.storyLineMenu.css('display', global.readyForActions ? 'block' : 'none');
                        }
                    }
                }
            }
        });

        // Add the global frame tools to the jQuery toolbox
        $.fn.extend(global.frameTools);
        
        // Create the menu
        var storyMenuCreate = function() {
            log(message.status.storyMenuCreate_init);
            // Create the frame list?
            if (false !== options.buildMenu) {
                // Create the menu
                global.storyLineMenu = $(
                    '<ul id="storyLineMenu" class="' + message.const.menuClass + '" '
                    + (options.guide ? 'style="'
                        + 'position:fixed;'
                        + 'top:0;'
                        + 'left:0;'
                        + 'width:100%;'
                        + 'height:52px;'
                        + 'text-align:center;'
                        + 'background:rgba(255,255,255,0.9);'
                        + 'box-shadow:0 2px 11px rgba(0,0,0,0.8);'
                        + 'border-bottom: 2px solid #aaa;'
                    + '" title=".' + message.const.menuClass + '"' : '')
                    + '></ul>'
                );
            
                // Overwrite the options.frameTop
                if (options.guide) {
                    log(message.status.frameTopOverwritten, logLevel.info);
                    options.frameTop = 53;
                }

                // Create the menu contents
                $.each(global.frameList, function(key,object){
                    var targetFrame = $(object);
                    if ('undefined' == typeof targetFrame.data(message.const.dataFrameInfo)) {
                        return false;
                    }
                    framePosition = targetFrame.data(message.const.dataFrameInfo)[message.const.dataFramePosition];
                    frameName = targetFrame.data(message.const.dataFrameInfo)[message.const.dataFrameName];

                    // Contents
                    global.storyLineMenuItem = $('<li class="' + message.const.menuItemClass + '" '
                        + (options.guide ? 'style="'
                            + 'display:inline-block;'
                            + 'height: 40px;'
                            + 'line-height: 40px;'
                            + 'font-size: 14px;'
                            + 'font-family: Arial;'
                            + 'color: #000;'
                            + 'cursor: pointer;'
                            + 'font-weight: bold;'
                            + 'padding: 0 10px;'
                            + 'margin: 5px 5px 0;'
                            + 'box-shadow: 0px 2px 3px rgba(0,0,0,0.6)'
                                + ', 0px 1px 0px rgba(255,255,255,0.5) inset'
                                + ', 0px -1px 1px rgba(0,0,0,0.6) inset;'
                            + 'border-left: 1px solid rgba(255,255,255,0.5);'
                            + 'border-right: 1px solid rgba(255,255,255,0.5);'
                            + 'text-shadow: 0px 1px 0px rgba(255,255,255,0.5);'
                            + 'border-radius: 6px;'
                            + 'background: #ccc;'
                            + 'filter: progid:DXImageTransform.Microsoft.gradient(startColorstr=\'#eeeeee\', endColorstr=\'#aaaaaa\');'
                            + 'background: -webkit-gradient(linear, left top, left bottom, from(#eeeeee), to(#aaaaaa));'
                            + 'background: -moz-linear-gradient(top,  #eeeeee,  #aaaaaa);'
                        + '" title=".' + message.const.menuItemClass + '"' : '')
                        + ' frame-pos="'
                        + framePosition
                        + '" frame-name="'
                        + frameName
                        + '">' 
                        + frameName 
                        + '<i></i></li>'
                    ) . data(message.const.dataTargetFrame, targetFrame)
                    . click(function(){
                        global.storyLineMenu.removeClass('active');
                        $(this).goToFrame(targetFrame);
                    });

                    // Append it to the menu
                    global.storyLineMenu.append(global.storyLineMenuItem);
                });

                // Append to body
                if (global.storyLineMenu.children().length) {
                    var mobileButton = $('<div class="storyline-mobile-button" style="display:none;"></div>');
                    mobileButton.click(function(){
                        if (global.storyLineMenu.hasClass('active')) {
                            global.storyLineMenu.removeClass('active');
                        } else {
                            global.storyLineMenu.addClass('active');
                        }
                    });
                    $(options.guide ? 'body': options.menuTarget).append(mobileButton).append(global.storyLineMenu);

                    // Append the extra CSS
                    if (options.guide) {
                        $('body').append($(
                            '<style type="text/css">'
                            + '.' + message.const.menuItemClass + '.active {'
                            + 'color: #00ffff !important;'
                            + 'border-left: 1px solid rgba(150,200,255,0.5) !important;'
                            + 'border-right: 1px solid rgba(150,200,255,0.5) !important;'
                            + 'text-shadow: 0px -1px 0px rgba(0,0,0,0.5) !important;'
                            + '}'
                            + '.' + message.const.menuItemClass + ':hover {'
                            + 'color: #00ffff !important;'
                            + 'border-left: 1px solid rgba(150,200,255,0.5) !important;'
                            + 'border-right: 1px solid rgba(150,200,255,0.5) !important;'
                            + 'text-shadow: 0px -1px 0px rgba(0,0,0,0.5) !important;'
                            + '}'
                            + '.' + message.const.menuItemClass + ':active {'
                            + 'box-shadow: 0px 0px 1px rgba(0,0,0,0.6)'
                                + ', 0px -1px 0px rgba(255,255,255,0.5) inset'
                                + ', 0px 1px 1px rgba(0,0,0,0.6) inset !important;'
                            + 'filter: progid:DXImageTransform.Microsoft.gradient(startColorstr=\'#aaaaaa\', endColorstr=\'#eeeeee\') !important;'
                            + 'background: -webkit-gradient(linear, left top, left bottom, from(#aaaaaa), to(#eeeeee)) !important;'
                            + 'background: -moz-linear-gradient(top,  #aaaaaa,  #eeeeee) !important;'
                            + '}'
                            + '</style>'
                        ));
                    }
                } else {
                    global.storyLineMenu = null;
                    log(message.error.storyMenuCreate_noItems, logLevel.error);
                }
            }
            log(message.status.storyMenuCreate_end);
        };        

        // Create the storyline guide
        var storyGuideCreate = function() {
            log(message.status.storyGuideCreate_init);
            // Populate the story guide object
            global.storyGuideObject = $(
                '<div style="'
                    + 'position:fixed;'
                    + 'top:50%;'
                    + 'height:5px;'
                    + 'width:100%;'
                    + 'background:rgba(0,255,0,0.5);'
                    + 'z-index:10000;'
                + '"></div>'
                + '<div rel="window" style="'
                    + 'position:fixed;'
                    + 'bottom:25px;'
                    + 'right:25px;'
                    + 'height:75px;'
                    + 'width:50%;'
                    + 'background:rgba(194,194,194,0.5);'
                    + 'z-index:10000;'
                + '">'
                    + '<div rel="slider" style="'
                        + 'position:absolute;'
                        + 'top: 0;'
                        + 'left: 0;'
                        + 'height: 100%;'
                        + 'width:' + (global.screenHeight/global.documentHeight*100) + '%;'
                        + 'background: rgba(255,255,255,0.5);'
                        + 'z-index:10001;'
                    + '">'
                        +'<div rel="cursor" style="'
                            + 'position:absolute;'
                            + 'top:0;'
                            + 'left:50%;'
                            + 'height: 100%;'
                            + 'width: 2px;'
                            + 'background:rgba(0,255,0,0.5);'
                            + 'z-index: 10002;'
                        +'"></div>'
                    +'</div>'
                    + '<div rel="slides"></div>' 
                + '</div>'
            );

            // Create the slides
            var slides = '';
            $.each(global.frameHeights,function(k,v){
                slides += 
                '<div rel="frame" key="'+k+'" style="'
                + 'position:absolute;'
                + 'z-index:10000;'
                + 'background:rgba(58,'
                    + ( global.frameActiveStates[k] ? '255' : '58' )
                    + ',58,0.5);'
                + 'left:' + (v.top / global.documentHeight * 100)  + '%;'
                + 'width:' + (v.height / global.documentHeight * 100)  + '%;'
                + 'height:100%;'
                + 'font-family:Arial;'
                + 'font-size:15px;'
                + 'color:#fff;'
                + 'font-size:2em;'
                + 'text-align:center;'
                + 'line-height:75px;'
                + 'box-shadow: 0px 2px 11px rgba(0,0,0,0.8) inset;'
                + '">'
                + k
                + '</div>';
            });

            // Add the slides
            $('[rel=slides]',global.storyGuideObject).append($(slides));
            
            // Append the guide to the body
            $('html').append(global.storyGuideObject);
            log(message.status.storyGuideCreate_end);
        };

        // Move the cursor for the storyline guide
        var storyGuideMove = function(to) {
            if (null === global.storyGuideObject) {
                //  Nothing to do
                return false;
            }

            // Update the slider
            $('[rel=slider]',global.storyGuideObject).css({
                left: (to/global.documentHeight*100) + '%',
                width: (global.screenHeight/global.documentHeight*100) + '%'
            });

            // Update child elements
            $.each($('[rel=slides] [rel=frame]',global.storyGuideObject),function(k,v){
                $(v).css({
                    left: (global.frameHeights[$(v).attr('key')].top / global.documentHeight * 100)  + '%',
                    width: (global.frameHeights[$(v).attr('key')].height / global.documentHeight * 100)  + '%',
                    background: 'rgba(58,'
                        + ( global.frameActiveStates[$(this).attr('key')] ? '255' : '58' )
                        + ',58,0.5)'
                });
            });
        };

        var recalibrateMenu = function() {
            if (global.framesLoaded && options.buildMenu) {
                global.mostVisibleFrame = null;
                global.mostVisibleFrameV = null;
                if (null !== global.storyLineMenu) {
                    $.each(global.frameCenterStates,function(frameCenterKey,frameCenterValue){
                        frameCenterValue = Math.abs(frameCenterValue);
                        if (null == global.mostVisibleFrame || frameCenterValue < global.mostVisibleFrameV) {
                            global.mostVisibleFrame = parseInt(frameCenterKey);
                            global.mostVisibleFrameV = frameCenterValue;
                        }
                    });
                    if (null !== global.mostVisibleFrame) {
                        global.frameTools.goToFrame(global.mostVisibleFrame,null,false);
                    }
                }
            }
        };

        // Create the story frames
        var storyFrame = function(u,f) {
            log(message.status.storyFrame_init.replace('__u__',u));
            // Preserve the selector
            var frameSelector = u;

            // Set the item
            var ui = $(u);

            // Set the functions
            var fn = {
                onEnter: null,
                onLeave: null,
                onActive: null
            };

            // The input is a function
            if (typeof f === 'function') {
                fn.onActive = f;
            } else if (typeof f === 'object') {
                fn = $.extend(fn,f);
            } else {
                log(message.error.storyFrame_notValid.replace('__element__', u), logLevel.error);
                return;
            }

            // Count the objects publicly
            $.each(ui,function(k,v){
                global.frameList[sizeof(global.frameList)+1] = $(v);
            });
        
            // Set the window scroll function
            var windowScrollFnc = function(e) {
                var storylineScrollTop = $(window).scrollTop();

                // For each object 
                $.each(ui,function(k,v){
                    var coords = {
                        frameTop: $(v).offset().top - storylineScrollTop,
                        frameLeft: $(v).offset().left,
                        frameWidth: $(v).width(),
                        frameHeight: $(v).height(),
                        screenWidth: global.screenWidth,
                        screenHeight: global.screenHeight,
                        frameBottom: global.screenHeight - $(v).offset().top - $(v).height() + storylineScrollTop,
                        frameRight: global.screenWidth - $(v).offset().left - $(v).width(),
                        screenScrollTop: storylineScrollTop,
                        frameMiddleDistance: 0,
                        percent: {}
                    };

                    // Set the frame information
                    if (!$(v).data(message.const.dataFrameInfo)) {
                        // Frame name
                        var frameName = message.const.frameNumber + global.frameIterator;
                        if (typeof options.buildMenu === 'object') {
                            if (typeof options.buildMenu[global.frameIterator-1] !== 'undefined') {
                                frameName = options.buildMenu[global.frameIterator-1];
                            } else {
                                if ($(v).attr('data-name')) {
                                    frameName = $(v).attr('data-name');
                                } else {
                                    log(message.error.buildMenu_notSet.replace('__no__', global.frameIterator), logLevel.error);
                                }
                            }
                        } 

                        $(v).data(message.const.dataFrameInfo,{
                            framePosition: global.frameIterator,
                            frameSelector: frameSelector,
                            frameName: frameName
                        });

                        // Increment the iterator
                        global.frameIterator++;
                    }

                    // Frame visible?
                    var visible = coords.frameBottom <= (coords.screenHeight + options.tolerance/2 - global.menuHeight) && coords.frameTop <= (coords.screenHeight + options.tolerance/2);

                    // Calculate the total percent played
                    coords.percent.screenPlayed = (storylineScrollTop) / (global.documentHeight - global.screenHeight) * 100;

                    // Peform only if visible
                    if (visible) {
                        // Calculate the percent visible
                        if (coords.frameBottom > 0) {
                            if (coords.frameTop < 0) {
                                coords.percent.frameVisible = (coords.screenHeight - coords.frameBottom + options.tolerance/2) / coords.frameHeight * 100;
                            } else {
                                coords.percent.frameVisible = 100;
                            }
                        } else {
                            coords.percent.frameVisible = (coords.screenHeight - coords.frameTop + options.tolerance/2) / coords.frameHeight * 100;
                        }
                        coords.percent.frameVisible = coords.percent.frameVisible < 0 ? 0 : coords.percent.frameVisible > 100 ? 100 : coords.percent.frameVisible;

                        // Calculate the middle distance
                        middleDistance = coords.frameTop + coords.frameHeight/2 + options.tolerance/2 - global.screenHeight/2;
                        middleDistance = middleDistance > coords.screenHeight + options.tolerance ? coords.screenHeight + options.tolerance : middleDistance;
                        coords.frameMiddleDistance = middleDistance;

                        // Calculate the percent centered
                        coords.percent.frameUnCentered = middleDistance / (coords.screenHeight/2) * 100;
                        if (coords.percent.frameUnCentered <= -100) coords.percent.frameUnCentered = -100;
                        if (coords.percent.frameUnCentered >= 100) coords.percent.frameUnCentered = 100;

                        // Call the onActive function
                        if(global.readyForActions && typeof fn.onActive === 'function') {
                            fn.onActive.call($(v),coords,e); 
                        }
                    } else {
                        // Set the coords percent values
                        coords.percent.frameVisible = 0;
                        coords.percent.frameUnCentered = -100;
                    }

                    // Update the current frames states
                    if (typeof global.frameActiveStates[$(v).data(message.const.dataFrameInfo)[message.const.dataFramePosition]] === 'undefined' || global.frameActiveStates[$(v).data(message.const.dataFrameInfo)[message.const.dataFramePosition]] !== visible) {
                        // Enter?
                        if (visible) {
                            // Call the onEnter function
                            if (global.readyForActions && typeof fn.onEnter === 'function') {
                                fn.onEnter.call($(v),coords,e);
                            }
                        } else {
                            // Call the onLeave function
                            if (global.readyForActions && typeof global.frameActiveStates[$(v).data(message.const.dataFrameInfo)[message.const.dataFramePosition]] !== 'undefined' && typeof fn.onLeave === 'function') {
                                fn.onLeave.call($(v),coords,e);
                            }
                        }

                        // Set the frame state
                        global.frameActiveStates[$(v).data(message.const.dataFrameInfo)[message.const.dataFramePosition]] = visible;
                    }

                    // Update the frame center state
                    global.frameCenterStates[$(v).data(message.const.dataFrameInfo)[message.const.dataFramePosition]] = coords.frameTop;

                    // Update the frame heights
                    global.frameHeights[$(this).data(message.const.dataFrameInfo)[message.const.dataFramePosition]] = {height:$(this).height(),top:$(v).offset().top};

                    // Show the coords
                    if (global.framesLoaded && options.guide) {
                        var frameguide = $('[rel=frameguide]',$(v));
                        if (frameguide.length === 0) {
                            frameguide = $(
                                '<div rel="frameguide" style="'
                                + 'position:absolute;'
                                + 'top:0;'
                                + 'left:0;'
                                + 'width:300px;'
                                + 'background:rgba(255,255,255,0.8);'
                                + 'box-shadow: 0px 5px 10px rgba(0,0,0,0.8);'
                                + 'color:#000000;'
                                + 'padding:10px;'
                                + 'font-size:12px;'
                                + 'line-height:14px;'
                                + 'font-family:Arial;'
                                + 'text-align:left;'
                                + '"></div>'
                            );
                            $(v).prepend(frameguide);
                        }
                        frameguide.css('display', global.readyForActions ? 'block' : 'none');

                        // Make the parent non-static
                        if ($(v).css('position') === 'static') {
                            $(v).css('position','relative');
                        }

                        // Prepare the content
                        var content = '<h4 style="color:#000000;font-size:14px;line-height:12px;">Frame info [$(this).data("frameInfo")]</h4>';
                        $.each($(v).data(message.const.dataFrameInfo),function(k,v) {
                            content += '<b style="color:#000000;">' + k + '</b>: '
                                + '<i style="color:#000000;">' + v + '</i>'
                                + '<br/>';
                        });

                        // Also add the frame coords
                        content += '<h4 style="color:#000000;font-size:14px;line-height:12px;">Frame coords [first callback argument]</h4>';
                        $.each(coords,function(k,v) {
                            // Prepare the value
                            if (typeof v === 'object') {
                                var newV = '';
                                $.each(v,function(k1,v1){
                                    newV += '<br/>&nbsp;&nbsp;&nbsp;<b style="color:#000000;">' + k1 + '</b>='
                                        + '<i style="color:#000000;">' + v1.toFixed(2) + '%</i>, ';
                                });
                                v = newV;
                            }
                            content += '<b style="color:#000000;">' + k + '</b>: '
                                + '<i style="color:#000000;">' + v + '</i>'
                                + '<br/>';
                        });

                        // Update the content
                        frameguide.html(content);
                    }
                });
                
                // Activate the menu
                recalibrateMenu();
                
                // Show the guide?
                if (global.framesLoaded && options.guide) {
                    storyGuideMove(storylineScrollTop);
                }
                
                global.screenHeight = $(window).height();
                global.screenWidth = $(window).width();
                global.documentHeight = $('body').outerHeight(true);
            };
        
            log(message.status.storyFrame_end.replace('__u__',u));
            return windowScrollFnc;
        };

        // Initialization
        var init = function() {
            // Set each frame, one by one
            global.framesLoaded = false;
            $.each(options.frames, function(k,v){
                if($(k).length > 0) {                   
                    $(window).scroll(storyFrame(k,v));
                } else {
                    log(message.error.storyFrame_elementNotFound.replace('__name__',k), logLevel.error);
                }
            });
            global.framesLoaded = true;

            // Window resize?
            $(window).resize(function(){
                $(window).trigger('scroll');
            });

            // Body change?
            $('body').change(function(){
                $(window).trigger('scroll');
            });
        
            // Automatically trigger the scroll
            $(window).trigger('scroll');

            if (false !== options.buildMenu) {
                storyMenuCreate();
                // The menu need recalibration
                if (null === global.storyLineMenu || null === global.mostVisibleFrame) {
                    recalibrateMenu();
                }
            }
        
            // Values calculated poorly on first try
            if (global.documentHeight <= global.screenHeight) {
                if (null !== global.storyGuideObject) {
                    $(global.storyGuideObject).css({
                        opacity: 0
                    });
                }
                setTimeout(function(){
                    var startScroll = $(window).scrollTop();
                    var endScroll = startScroll + 1;
                    if (($(window).innerHeight() + $(window).scrollTop()) >= $("body").height()) {
                        endScroll  = startScroll - 1;
                    }
                    log(message.error.needsRefresh
                        .replace('__start__', startScroll)
                        .replace('__end__', endScroll)
                        .replace('__time__', 10)
                        , logLevel.info
                    );

                    $('html,body').stop().animate({
                        scrollTop: endScroll
                    }, 5, function(){
                        if ($(this).is('body')) {
                            $('html,body').stop().animate({scrollTop:startScroll}, 5, function(){
                                if ($(this).is('body')) {
                                    if (null !== global.storyGuideObject) {
                                        $(global.storyGuideObject).animate({opacity:1},200);
                                    }
                                    // Still bad?
                                    if (global.documentHeight <= global.screenHeight) {
                                        log(message.error.invalidContent, logLevel.error);
                                        $(window).unbind('scroll').die();
                                        $('[rel=frameguide]').remove();
                                        $(global.storyGuideObject).remove();
                                        $(global.storyLineMenu).remove();
                                        $(global.guideConsole).css({
                                            background:'#000',
                                            maxHeight: '275px',
                                            bottom: '25px'
                                        });
                                    } else {
                                        global.readyForActions = true;
                                        if (options.guide) storyGuideCreate();
                                    }
                                }
                            });
                        }
                    });
                }, message.const.refreshAfter);
            } else {
                global.readyForActions = true;
                if (options.guide) storyGuideCreate();
                $(window).trigger('scroll');
                if (typeof global.menuHeight == 'undefined') {
                    if (options.menuParent) {
                        global.menuHeight = global.storyLineMenu.parents(options.menuParent).height();
                    } else {
                        global.menuHeight = global.storyLineMenu.height();
                    }
                }
            }
            return global;
        };
    
        // Go
        return init();
    }
});