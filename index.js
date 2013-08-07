(function(exportTo) {
	"use strict";
	
	// Nodes which should be considered implicitly self-closing	
	// Taken from http://www.whatwg.org/specs/web-apps/current-work/multipage/syntax.html#void-elements
	var voidElements = [
		"area", "base", "br", "col", "command", "embed", "hr", "img", "input",
		"keygen", "link", "meta", "param", "source", "track", "wbr"
	];
	
	var downsize = function(text,options,offset) {
		var stack = [],
			pointer = 0,
			tagName = "",
			parseState = 0,
			countState = {},
			tagBuffer = "",
			truncatedText = "";
		
		var options		= options && typeof options === "object" ? options : {},
			wordChars	= options.wordChars instanceof RegExp ?
								options.wordChars : /[a-z0-9\-\']/i;
		
		function count(chr,track) {
			var limit = options.words || (options.characters+1) || Infinity;
			
			if (!("unitCount" in track))
				track.unitCount = 0;
			
			// Tick-tock state storage for counting words
			// If it doesn't exist, initialise it with value of current char
			if (!("countState" in track))
				track.countState = !!(chr+"").match(wordChars);
			
			if (options.words) {
				if (!!(chr+"").match(wordChars) !== track.countState) {
					
					track.countState = !!(chr+"").match(wordChars);
					
					// Only count the words on the "tock", or we'd be counting
					// them twice.
					if (!track.countState)
						track.unitCount ++;
				}
			
			// We pass in empty values to count word boundries defined by tags.
			// This isn't relevant to character truncation.
			} else if (chr !== "") {
				
				track.unitCount ++;
			}
			
			// Return true when we've hit our limit
			return (track.unitCount >= limit);
		}
		
		// Define our parse states
		var PARSER_UNINITIALISED		= 0,
			PARSER_TAG_COMMENCED		= 1,
			PARSER_TAG_STRING 			= -1,
			PARSER_TAG_STRING_SINGLE 	= -2,
			PARSER_COMMENT 				= -3;
		
		for (; pointer < text.length; pointer ++ ) {
			
			if (parseState !== PARSER_UNINITIALISED)
				tagBuffer += text[pointer];
			
			switch (text[pointer]) {
				
				case "<":
					// Ooh look — we're starting a new tag.
					// (Provided we're in uninitialised state and the next
					// character is a word character, explamation mark or slash)
					if (parseState === PARSER_UNINITIALISED &&
						text[pointer+1].match(/[a-z0-9\-\_\/\!]/)) {
						
						parseState = PARSER_TAG_COMMENCED;
						tagBuffer += text[pointer];
					}
					
					break;
				
				case "!":
					if (parseState === PARSER_TAG_COMMENCED &&
						text[pointer-1] === "<") {
						
						parseState = PARSER_COMMENT;
					}
					
					break;
					
				case "-":
					if (parseState === PARSER_COMMENT)
						parseState = PARSER_COMMENT;
					
					break;
				
				case "\"":
					if (parseState === PARSER_TAG_STRING) {
						parseState = PARSER_TAG_COMMENCED;
						
					} else if (parseState !== PARSER_UNINITIALISED) {
						parseState = PARSER_TAG_STRING;
					}
					
					break;
				
				case "'":
					if (parseState === PARSER_TAG_STRING_SINGLE) {
						parseState = PARSER_TAG_COMMENCED;
						
					} else if (parseState !== PARSER_UNINITIALISED) {
						parseState = PARSER_TAG_STRING_SINGLE;
					}
					
					break;
				
				case ">":
					
					if (parseState === PARSER_TAG_COMMENCED) {
						
						parseState = PARSER_UNINITIALISED;
						truncatedText += tagBuffer;
						tagName = getTagName(tagBuffer);
						
						// Closing tag. (Do we need to be more lenient/)
						if (tagBuffer.match(/<\s*\//)) {
							
							// We don't attempt to walk up the stack to close
							// tags. If the text to be truncated contains 
							// malformed nesting, we just close what we're 
							// permitted to and clean up at the end.
							if (getTagName(stack[stack.length-1]) === tagName) {
								stack.pop();
							}
							
						// Nope, it's an opening tag.
						} else {
							
							// Don't push self closing or void elements on to
							// the stack, since they have no effect on nesting.
							
							if (voidElements.indexOf(tagName) < 0 &&
								!tagBuffer.match(/\/\s*>$/)) {
								
								stack.push(tagBuffer);
							}
						}
						
						tagBuffer = "";
						
						// Closed tags are word boundries. Count!
						count("",countState);
						
						// Because we've reset our parser state we need
						// to manually short circuit the logic that comes next.
						continue;
					}
					
					if (parseState === PARSER_COMMENT &&
						text.substring(pointer-2,pointer) === "--") {
						
						parseState = PARSER_UNINITIALISED;
						truncatedText += tagBuffer;
						tagBuffer = "";
						
						// Closed tags are word boundries. Count!
						count("",countState);
						
						// Another cleanup short-circuit...
						continue;
					}
					
					break;
			}
			
			// We're not inside a tag, comment, attribute, or string.
			// This is just text.
			if (!parseState) {
				
				// Have we had enough of a good thing?
				if (count(text[pointer],countState)) break;
				
				// Nope, we still thirst for more.
				truncatedText += text[pointer];
			}
		}
		
		if (options.append && (stack.length || tagBuffer.length)) {
			truncatedText = truncatedText.trim() + options.append;
		}
		
		// Append anything still left in the buffer
		truncatedText += tagBuffer;
		
		// Balance anything still left on the stack
		while (stack.length) {
			truncatedText += closeTag(stack.pop());
		}
		
		return truncatedText;
	};
	
	function closeTag(openingTag) {
		// Grab the tag name, including namespace, if there is one.
		var tagName = getTagName(openingTag);
		
		// We didn't get a tag name, so return nothing. Better than
		// a bad prediction, or a junk tag.
		if (!tagName) return "";
		
		return "</" + tagName + ">";
	}
	
	function getTagName(tag) {
		var tagName = (tag||"").match(/<\/*([a-z0-9\:\-\_]+)/i);
		return tagName ? tagName[1] : null;
	}
	
	// Export to node
	if (typeof module !== undefined && module.exports)
		return module.exports = downsize;
	
	// Nope, export to the browser instead.
	exportTo.downsize = downsize;
}(this));