(function(w,d,q){
	var OldIEMode = (w==d&&d!=w);
	var OldIESelect = function(a,b){
		return OldIEMode?b:a;
	};
	var I64BIT_TABLE =
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('');
	
	var UUID = function(){
				var len = isNaN(arguments[0])?32:arguments[0];
				var radix = isNaN(arguments[1])||arguments[1]>62?62:arguments[1];
				var uuid = null;
	    	radix = radix==0?I64BIT_TABLE.length:radix;
	    	if (len>0) {
		      uuid = new Array(len);
		      for (var i = 0; i < len; i++) uuid[i] = I64BIT_TABLE[parseInt(Math.random()*radix)];
		    } else {
		      // rfc4122, version 4 form
		      var r;
		      len=36;
		      uuid = new Array(len);
		      // rfc4122 requires these characters
		      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
		      uuid[14] = '4';
		      for (var i = 0; i < len; i++) {
		        if (!uuid[i]) {
		          r =  parseInt(Math.random()*16);
		          uuid[i] = I64BIT_TABLE[(i == 19) ? (r & 0x3) | 0x8 : r];
		        }
		      }
		    }
		    return uuid.join("");
		};
		Number.prototype.hashCode = function(){
			return String(this).hashCode();	
		};
		Boolean.prototype.hashCode = function(){
			return String(this).hashCode();	
		};
		Date.prototype.hashCode = function(){
			if(this.hash)
				return this.hash;
			else
				return this.hash = String(this).replace(/([\r\n])\s*/g,"").hashCode();
		};
		Function.prototype.hashCode = function(){
			if(this.hash)
				return this.hash;
			else
				return this.hash = String(this).replace(/([\r\n])\s*/g,"").hashCode();
		};
		Object.prototype.hashCode = function(nd){
			if(this.hash)
				return this.hash;	
			else{
				var hash = [];
				for(var key in this){
					hash.push(key.hashCode());
					var type = rawType(this[key]);
					if(rawType.Object === type||rawType.Array === type){
						if(nd){
							hash.push(type);
						}else{
							hash.push(this[key].hashCode(true));
						}
					}else if(rawType.String === type){
						hash.push(this[key].hashCode());
					}else{
						hash.push(String(this[key]).hashCode());	
					}
				}
				hash.push(UUID());
				return this.hash = hash.join("").hashCode();
			}
		};
		Array.prototype.hashCode = function(nd){
			if(this.hash)
				return this.hash;
			else{
				var hash = [];
				for(var i = 0;i<this.length;i++){
					hash.push(i);
					var type = rawType(this[i]);
					if(rawType.Object === type||rawType.Array === type){
						if(nd){
							hash.push(type);
						}else{
							hash.push(this[i].hashCode(true));
						}
					}else if(rawType.String === type){
						hash.push(this[i].hashCode());
					}else{
						hash.push(String(this[i]).hashCode());	
					}
				}	
				hash.push(UUID());
				return this.hash = hash.join("").hashCode();
			}
		};
		String.HashTable = {};
		String.prototype.hashCode = function(){
			if(String.HashTable[this])
				return String.HashTable[this];
			else{
					var seed = 5381,i = this.length - 1;
					for (; i > -1; i--)
					seed += (seed << 5) + this.charCodeAt(i);
					var value = seed & 0x7FFFFFFF;
					var hash = [];
					do{
						hash.push(I64BIT_TABLE[value & 0x3F]);
					}while(value >>= 6);
					return String.HashTable[this] = hash.join("");
			}
				
		};
		String.prototype.trim = function () {
			return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
		};
		String.prototype.contains = function(str){
			return this.indexOf(str)>-1;	
		}
		Function.prototype.before = function(func){
			var __self = this;
			return function(){
				var joinPoint = {
					args : arguments,
					proxy : this,
					resume : true,
					result : undefined
				};
				func.apply(this,[joinPoint]) ;
				return joinPoint.resume?__self.apply(this,joinPoint.args):joinPoint.result;
			};
		};
		Function.prototype.after = function(func){
			var __self = this;
			return function(){
				var joinPoint = {
					result : undefined,
					proxy : this
				};
				joinPoint.result = __self.apply(this,arguments) ;
				func.apply(this,[joinPoint]);
				return joinPoint.result;
			};
		};
		Function.prototype.around = function(func){
			var __self = this;
			return function(){
				var joinPoint = {
					invoke : function(){
						return this.func.apply(this.proxy,this.args);
					},
					func : __self,
					args : arguments,
					proxy : this
				};
				return func.apply(this,[joinPoint]);
			};
		};
		Function.prototype.throwing = function(func){
			var __self = this;
			return function(){
				try {
					return __self.apply(this,arguments);
				} catch (e) {
					func(e);
				}
			};
		};
		Function.prototype.asConstructor = function(name){
			rawType.loadType(name,this);
			return this;
		};
		
		var O2Type = w.Object.prototype.toString.after(function(jp){
				jp.result = rawType.valueOf(jp.result);
		});
		
		var rawType = function(obj){
			return obj===undefined
								?rawType.Undefined
								:obj===null
										?rawType.Null
										:obj.constructor.isCtor
														?obj.constructor.type
														:O2Type.call(obj);
		};
		rawType.loadType = function(typeName,ctor){
			if(typeName in rawType)
				throw typeName+" is registered";
			rawType[typeName] = { 
				typeName : "[object "+typeName+"]",
				cached : ctor,
				derived : function(obj){
					return this === rawType(obj);
				},
				toString : function(){
					return this.typeName;	
				}
			};
			rawType[rawType[typeName]] = rawType[typeName];
			if(ctor){
				ctor.isCtor = true;
				ctor.ctorId = String(this).hashCode();
				ctor.type = rawType[typeName];
			}
			return rawType[typeName];
		};
		rawType.valueOf = function(str){
			return rawType[str];
		}.after(function(jp){
			assertValid(jp.result);
		});
		rawType.loadType("Number",w.Number);
		rawType.loadType("Boolean",w.Boolean);
		rawType.loadType("String",w.String);
		rawType.loadType("Date",w.Date);
		rawType.loadType("Function",w.Function);
		rawType.loadType("Object",w.Object);
		rawType.loadType("Array",w.Array);
		rawType.loadType("Undefined",undefined);
		rawType.loadType("Null",null);
		
		var ff = function(selector){
			return new ff.dm.init(q(selector));
		}.asConstructor("Flyfire");
		
		
		ff.rawType = rawType;
		ff.UUID = UUID;
		var assertDefined = ff.assertDefined = function(obj,e){
			if(obj===undefined)throw e||"object is undefined...";
		};
		var assertNotNull = ff.assertNotNull = function(obj,e){
			if(obj===null)throw e||"object is null...";
		};
		var assertValid = ff.assertValid = function(obj,e){
			assertDefined(obj,e);
			assertNotNull(obj,e);
		};
		var assertType = ff.assertType = function(obj,type,strict,e){
			var t = rawType(obj);
			if(t!==type){
				if(!strict&&(t===rawType.Undefined||t===rawType.Null))return;
				throw e||"expected:"+type+"unexpected:"+t;
			}
		};
		var assertNumber = ff.assertNumber = function(obj,e){
			assertType(obj,rawType.Number,false,e);
		};
		var assertBoolean = ff.assertBoolean = function(obj,e){
			assertType(obj,rawType.Boolean,false,e);
		};
		var assertString = ff.assertString = function(obj,e){
			assertType(obj,rawType.String,false,e);
		};
		var assertDate = ff.assertDate = function(obj,e){
			assertType(obj,rawType.Date,false,e);
		};
		var assertFunction = ff.assertFunction = function(obj,e){
			assertType(obj,rawType.Function,false,e);
		};
		var assertObject = ff.assertObject = function(obj,e){
			assertType(obj,rawType.Object,false,e);
		};
		var assertArray = ff.assertArray = function(obj,e){
			assertType(obj,rawType.Array,false,e);
		};
		var isUndefined = ff.isUndefined = function(obj,func){
			return obj===undefined&&func&&(func)();
		}.before(function(jp){
			assertFunction(jp.args[1]);
		});
		ff.dm = ff.prototype;
		ff.dm.init = function(doms){
			this.doms = doms;
		};
		ff.dm.init.prototype = ff.dm;
		var each = ff.each = function(iterable,func,filter){
			if(iterable){
				if("length" in iterable){
					for(var i = 0;i<iterable.length;i++){
						if(filter&&!filter.apply(iterable[i],[i,iterable[i]]))continue;
						func.apply(iterable[i],[i,iterable[i]]);
					}
				}else{
					for(var key in iterable){
						if(filter&&!filter.apply({key:key,value:iterable[key]},[key,iterable[key]]))continue;
						func.apply({key:key,value:iterable[key]},[key,iterable[key]]);
					}
				}
			}
		}.before(function(jp){
			assertFunction(jp.args[1]);
		});
		
		var cloneObject = function(obj,context){
			var target = {};
			if(context){
				context[obj.hashCode()] = target;	
			}else{
				var hash = obj.hashCode();
				context = {hash:target};
			}
			for(var key in obj){
					var type = rawType(obj[key]);
					if(type===rawType.Array){
						var hash = obj[key].hashCode();
						if(context[hash]){
							target[key] = context[hash];
						}else{
							target[key] = cloneArray(obj[key],context);	
						}
					}else if(type===rawType.Object){
						var hash = obj[key].hashCode();
						if(context[hash]){
							target[key] = context[hash];
						}else{
							target[key] = cloneObject(obj[key],context);	
						}
					}else{
						target[key] = obj[key];
					}
			}
			return target;
		}.before(function(jp){
			assertObject(jp.args[0]);
			assertObject(jp.args[1]);
		});
		
		var cloneArray = function(arr,context){
			var target = [];
			if(context){
				context[arr.hashCode()] = target;	
			}else{
				var hash = arr.hashCode();
				context = {hash:target};
			}
			for(var i = 0;i<arr.length;i++){
					var type = rawType(arr[i]);
					if(type===rawType.Array){
						var hash = arr[i].hashCode();
						if(context[hash]){
							target[i] = context[hash];
						}else{
							target[i] = cloneArray(arr[i],context);	
						}
					}else if(type===rawType.Object){
						var hash = arr[i].hashCode();
						if(context[hash]){
							target[i] = context[hash];
						}else{
							target[i] = cloneObject(arr[i],context);	
						}
					}else{
						target[i] = obj[i];
					}
			}
			return target;
		}.before(function(jp){
			assertArray(jp.args[0]);
			assertObject(jp.args[1]);
		});
		
		var clone = ff.clone = function(obj){
			var type = rawType(obj);
			if(type===rawType.Array){
				return cloneArray(obj);	
			}else if(type===rawType.Object){
				return cloneObject(obj);
			}else{
				return obj;
			}
		};
		
		var extend = ff.extend = function(){
			var target = {};
			for(var i = arguments.length;i--;){
				for(var name in arguments[i]){
					if(!arguments[i].hasOwnProperty(name)) continue;
					var type = rawType(arguments[i][name]);
					if(type === rawType.Object){
						if(name in target)
							target[name] = extend(arguments[i][name],target[name]);
						else
							target[name] = cloneObject(arguments[i][name]);
					}else if(type === rawType.Array){
						if(name in target)
							continue;
						else
							target[name] = 	cloneArray(arguments[i][name]);
					}else{
						if(name in target)continue;
						target[name] = 	arguments[i][name];
					}
				}
			}
			return target;
		};
		
		ff.dm.each = function(func){
			each(this.doms,func);
			return this;
		};
		var eventHook = {
			input : OldIESelect("input","propertychange")
		};
		var on = ff.on = OldIESelect(function(dom,type,func,useCapture){
			dom.addEventListener(eventHook[type]||type,func,useCapture||false);
		},function(dom,type,func){
			var callback = function(o,h){
				return function(){
					h.apply(o,arguments);
				};
			}(dom,func);
			dom[func.hashCode()] = callback;
			dom.attachEvent("on" + (eventHook[type]||type), callback);
		}).before(function(jp){
			assertString(jp.args[1]);
			assertFunction(jp.args[2]);
		});
		ff.dm.on = function(type,func,useCapture){
			this.each(function(){
				on(this,type,func,useCapture);	
			});
			return this;
		};
		var off = ff.off = OldIESelect(function(dom,type,func,useCapture){
			dom.removeEventListener(eventHook[type]||type, func,useCapture||false);
		},function(dom,type,func){
			var callback = obj[func.hashCode()];
			dom.detachEvent("on" + (eventHook[type]||type), callback);
		}).before(function(jp){
			assertString(jp.args[1]);
			assertFunction(jp.args[2]);
		});
		ff.dm.off = function(type,func,useCapture){
			this.each(function(){
				off(this,type,func,useCapture);	
			});
			return this;
		};
		
		var isEmptyExp = /^\s{0,}$/g;
    isEmptyExp.test = isEmptyExp.test.after(function(){
    	this.restore();	
    });
		var getText = ff.getText = function(dom){
    	var results = [];
    	each(dom.childNodes,function(){
    		if(this.nodeType===3){
    			if(!isEmptyExp.test(this.nodeValue))
	    			results.push(this);
    		};
    	});	
    	return results.join('');
    };
    var setText = ff.setText = function(dom,text){
    	var did = false;
    	each(dom.childNodes,function(){
    		if(this.nodeType===3){
    			if(!isEmptyExp.test(this.nodeValue)){
    				if(did){
    					this.nodeValue = "";
    				}else{
		    			this.nodeValue = text;
		    			did = true;
		    		}
	    		}
    		};
    	});	
    };
		ff.dm.text = function(text){
			if(arguments.length===1){
				each(this.doms,function(){
						setText(this,text);	
				});
				return this;
			}else{
				var text = [];
				each(this.doms,function(){
						text.push(getText(this));	
				});
				return text.join(",");
			}
		};
		var setVal = ff.setVal = function(dom,val){
			dom.value = val;
		};
		var getVal = ff.getVal = function(dom){
			return dom.value;
		};
		ff.dm.val = function(val){
			if(arguments.length===1){
					each(this.doms,function(){
						setVal(this,val);	
					});
					return this;
			}else{
				var val = [];
				each(this.doms,function(){
						val.push(getVal(this,val));	
				});
				return val.join(",");
			}
		};
		var attrHook = {
		};
		var getAttr = ff.getAttr = function(dom,attr){
    	return dom.getAttribute(attrHook[attr]||attr);
    };
    var setAttr = ff.setAttr = function(dom,attr,val){
    	if(val!==getAttr(dom,attr)){
	    	dom.setAttribute(attrHook[attr]||attr,val);
	    }
    };
    var attrPolyfill = {
    	text : 	{
    		get : getText,
    		set : setText
    	},
    	value : {
    		get : getVal,
    		set : setVal	
    	}
    };
		ff.dm.attr = function(attr,val){
			if(arguments.length===2){
				this.each(function(){
					attrPolyfill[attr]?attrPolyfill[attr].set(this,val):setAttr(this,attr,val);
				});	
				return this;
			}else{
				var attrVal = [];
				this.each(function(){
					attrVal.push(attrPolyfill[attr]?attrPolyfill[attr].get(this):getAttr(this,attr));	
				});	
				return attrVal.join(",");
			}
		}.before(function(jp){
			assertString(jp.args[0]);	
		});
		
		ff.dm.push = function(dom){
			"length" in dom ?this.doms.push.apply(this.doms,dom):this.doms.push.call(this.doms,dom);	
			return this;
		}
		
		var getChild = ff.getChild = function(dom){
			var child = [];
			each(dom.childNodes,function(){
				if(this.nodeType===1){
					child.push(this);	
				}	
			});
			return child;
		};
		
		ff.dm.child = function(){
			var child = new ff.dm.init([]);
			each(this.doms,function(){
				child.push(getChild(this));
			});	
			return child;
		}
		
		var getParent = ff.getParent = function(dom){
			return dom.parentNode;
		};
		
		ff.dm.parent = function(){
			var parent = new ff.dm.init([]);
			each(this.doms,function(){
				parent.push(getParent(this));
			});
			return parent;
		};
		
		var append = ff.append = function(parent,child){
			parent.appendChild(child);
		};
		ff.dm.append = function(dom){
			each(this.doms,function(){
				append(this,dom);
			});	
		}
		
		var remove = ff.remove = function(child){
			child.parentNode.removeChild(child);	
		}
		
		ff.dm.remove = function(){
			each(this.doms,function(){
				remove(this);
			});	
		}
		
		var replace = ff.repalce = function(oldDom,newDom){
			oldDom.parentNode.replaceChild(newDom,oldDom);
		};
		
		ff.dm.replace = function(dom){
			each(this.doms,function(){
				replace(this,dom);
			});	
		}
		var fieldMediator = function(instance, descriptors, name, value) {
          var descriptor = descriptors[name];
          if (arguments.length === 4) {
              descriptor.set.call(instance, value);
          } else {
              return descriptor.get.call(instance);
          }
      };
		var defineProperties = ff.defineProperties = OldIESelect((function(defineProperties){
			var JsProxy = function(JSObject,JSAccessorStore,fieldMediator){
				this.JSObject = JSObject;
				this.JSAccessorStore = JSAccessorStore;
				this.fieldMediator = fieldMediator;
			}.asConstructor("JsProxy");
			w.stringify = JSON.stringify;
			JSON.stringify = JSON.stringify.before(function(jp){
					if(rawType["JsProxy"].derived(jp.args[0])){
						jp.result = w.stringify(jp.args[0].JSObject);
						jp.resume = false;
					}
			});
			return function(instance,accessors){
				var jsPxy = new JsProxy(instance,accessors,fieldMediator);
				var defineDescription = {};
				each(accessors,function(){
						defineDescription[this.key] = {};
						(function(fieldName,get,set){
							set&&(defineDescription[fieldName].set = function(val){
								fieldMediator(this.JSObject,this.JSAccessorStore,fieldName,val);
							});
							get&&(defineDescription[fieldName].get = function(){
								return fieldMediator(this.JSObject,this.JSAccessorStore,fieldName);
							});
						})(this.key,this.value.get,this.value.set);
				},function(){
					return !rawType.Function.derived(this.value);
				});
				return defineProperties(jsPxy,defineDescription);
			}
			})(Object.defineProperties),OldIEMode&&(function(){
			w.execScript([
          "Function parseVB(code)",
          "\tExecuteGlobal(code)",
          "End Function"
      ].join("\r\n"), "VBScript");
      fieldMediator = fieldMediator.around(function(jp){
      	if(jp.args[2]==="constructor"){
          return jp.args[0].constructor;
        }else{
        	return jp.invoke();	
        }	
      });
			var JsProxy = function(className){
				this.className = className||("VBClass"+UUID());
				this.buffer = [
					"Class "+this.className,
					"\tPrivate JSObject,JSAccessorStore,fieldMediator",
					"\tPublic Default Function Construtor(o, a, fm)",
        	"\t\tSet JSObject = o : set JSAccessorStore = a : set fieldMediator = fm ",
        	"\t\tSet Construtor = Me",
        	"\tEnd Function"
				];
			};
			JsProxy.prototype.field = function(fieldName,get,set){
				set&&this.buffer.push(
	        		"\tPublic Property Let " + fieldName + "(val)",
							"\t\tCall fieldMediator(JSObject,JSAccessorStore, \"" + fieldName + "\", val)",
							"\tEnd Property",
							"\tPublic Property Set " + fieldName + "(val)",
							"\t\tCall fieldMediator(JSObject,JSAccessorStore, \"" + fieldName + "\", val)",
							"\tEnd Property"
				);
				get&&this.buffer.push(
							"\tPublic Property Get " + fieldName + "",
							"\tOn Error Resume Next",
							"\t\tSet " + fieldName + " = fieldMediator(JSObject,JSAccessorStore,\"" + fieldName + "\")",
							"\tIf Err.Number <> 0 Then",
							"\t\t" + fieldName + " = fieldMediator(JSObject,JSAccessorStore,\"" + fieldName + "\")",
							"\tEnd If",
							"\tOn Error Goto 0",
							"\tEnd Property"
				);
			};
			JsProxy.prototype.classes = function(){
				this.field("constructor",function(){});
				this.buffer.push(
        		"\tPublic Function serialize ()",
        		"\t\tserialize = window.stringify(JSObject)",
        		"\tEnd Function",
						"End Class"
				);
				w.parseVB(this.buffer.join("\r\n"));
			};
			JsProxy.prototype.proxy = function(instance,accessors,fieldMediator){
				w.parseVB([
              "Function " + this.className + "Factory(instance,descriptors,fieldMediator)",
              "\tDim result",
              "\tSet result = (New " + this.className + ")(instance,descriptors,fieldMediator)",
              "\tSet " + this.className + "Factory = result",
              "End Function"
               ].join("\r\n"));
        return w[this.className + "Factory"](instance,accessors,fieldMediator);
			};
			w.stringify = JSON.stringify;
			JSON.stringify = JSON.stringify.around(function(jp){
					var result = jp.invoke();
					if(jp.args[0]!==undefined&&result===undefined){
						result = jp.args[0].serialize();
					}
					return result;
			});
			return function(instance,accessors){
				var jsPxy = new JsProxy();
				each(accessors,function(){
						jsPxy.field(this.key,this.value.get,this.value.set);
				});
				jsPxy.classes();
				return jsPxy.proxy(instance,accessors,fieldMediator);
			};	
		})()).before(function(jp){
			assertObject(jp.args[0]);	
		});
		
		/**
		* event{
		*		target: object/array
		*		trigger: key/index
		*		oldValue:	object[key]/array[index] @before set access
		*		newValue:	object[key]/array[index] @after set access
		*		value: object[key]/array[index] @before get access
		*		type:	set/get
		*}
		*/
		
		var mockContext = {};
		
		var mockObject = ff.mockObject = function(instance){
			var context = mockContext[instance.hashCode()] = {};
			var accessors = {};
			each(instance,function(){
					var hooks = context[this.key] = {};
					var accessor = accessors[this.key] = {};
					hooks.get = {log:function(e){console.log(e);}};
					accessor.get = (function(key,hooks){
							return function(){
								var mockEvent = {type:'get',trigger:key,target:this,value:this[key]};
								each(hooks,function(){
									(this.value)(mockEvent);
								});
								return this[key];	
							}
					})(this.key,hooks.get);
					hooks.set = {log:function(e){console.log(e);}};
					accessor.set = (function(key,hooks){
							return function(value){
								var mockEvent = {type:'set',trigger:key,target:this,oldValue:this[key],newValue:value};
								each(hooks,function(){
									(this.value)(mockEvent);
								});
								this[key] = value;	
							}
					})(this.key,hooks.set);
			},function(){
				return !rawType["Function"].derived(this.value);	
			});
			console.log(accessors);
			return defineProperties(instance,accessors);
		};
		
		var mockArray = ff.mockArray = function(instance){
			instance.push = instance.push.around(function(jp){
					
			});
		}.before(function(jp){
			assertArray(jp.args[0]);	
		});
		
		var mock = ff.mock = function(instance){
			if(rawType["Object"].derived(instance)){
				mockObject(instance);
			}else if(rawType["Array"].derived(instance)){
				mockArray(instance);
			}else{
				throw 'expected Object or Array...';	
			}
		}
		
		var context = ff.context = function(dom,options){
			var ops = extend({
					render : 'body'
			},options);
		};
		
		var VDom = function(real,parent){
				this.real = real;
				this.parent = parent;
				this.count = 0;
		};
		VDom.prototype.scanTag = function(){
			this.real.child();
		}
		VDom.prototype.counter = function(){
				this.count++;
				this.parent&&this.parent.counter();
		};
		
		w.flyfire = ff;
	})(window,
	document,
	/*!
	* Sizzle CSS Selector Engine v@VERSION
	* https://sizzlejs.com/
	*
	* Copyright jQuery Foundation and other contributors
	* Released under the MIT license
	* http://jquery.org/license
	*
	* Date: @DATE
	*/
(function(window){var i,support,Expr,getText,isXML,tokenize,compile,select,outermostContext,sortInput,hasDuplicate,setDocument,document,docElem,documentIsHTML,rbuggyQSA,rbuggyMatches,matches,contains,expando="sizzle"+1*new Date(),preferredDoc=window.document,dirruns=0,done=0,classCache=createCache(),tokenCache=createCache(),compilerCache=createCache(),sortOrder=function(a,b){if(a===b){hasDuplicate=true}return 0},hasOwn=({}).hasOwnProperty,arr=[],pop=arr.pop,push_native=arr.push,push=arr.push,slice=arr.slice,indexOf=function(list,elem){var i=0,len=list.length;for(;i<len;i++){if(list[i]===elem){return i}}return-1},booleans="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",whitespace="[\\x20\\t\\r\\n\\f]",identifier="(?:\\\\.|[\\w-]|[^\0-\\xa0])+",attributes="\\["+whitespace+"*("+identifier+")(?:"+whitespace+"*([*^$|!~]?=)"+whitespace+"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+identifier+"))|)"+whitespace+"*\\]",pseudos=":("+identifier+")(?:\\(("+"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|"+"((?:\\\\.|[^\\\\()[\\]]|"+attributes+")*)|"+".*"+")\\)|)",rwhitespace=new RegExp(whitespace+"+","g"),rtrim=new RegExp("^"+whitespace+"+|((?:^|[^\\\\])(?:\\\\.)*)"+whitespace+"+$","g"),rcomma=new RegExp("^"+whitespace+"*,"+whitespace+"*"),rcombinators=new RegExp("^"+whitespace+"*([>+~]|"+whitespace+")"+whitespace+"*"),rattributeQuotes=new RegExp("="+whitespace+"*([^\\]'\"]*?)"+whitespace+"*\\]","g"),rpseudo=new RegExp(pseudos),ridentifier=new RegExp("^"+identifier+"$"),matchExpr={"ID":new RegExp("^#("+identifier+")"),"CLASS":new RegExp("^\\.("+identifier+")"),"TAG":new RegExp("^("+identifier+"|[*])"),"ATTR":new RegExp("^"+attributes),"PSEUDO":new RegExp("^"+pseudos),"CHILD":new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+whitespace+"*(even|odd|(([+-]|)(\\d*)n|)"+whitespace+"*(?:([+-]|)"+whitespace+"*(\\d+)|))"+whitespace+"*\\)|)","i"),"bool":new RegExp("^(?:"+booleans+")$","i"),"needsContext":new RegExp("^"+whitespace+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+whitespace+"*((?:-\\d)?\\d*)"+whitespace+"*\\)|)(?=[^-]|$)","i")},rinputs=/^(?:input|select|textarea|button)$/i,rheader=/^h\d$/i,rnative=/^[^{]+\{\s*\[native \w/,rquickExpr=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,rsibling=/[+~]/,runescape=new RegExp("\\\\([\\da-f]{1,6}"+whitespace+"?|("+whitespace+")|.)","ig"),funescape=function(_,escaped,escapedWhitespace){var high="0x"+escaped-0x10000;return high!==high||escapedWhitespace?escaped:high<0?String.fromCharCode(high+0x10000):String.fromCharCode(high>>10|0xD800,high&0x3FF|0xDC00)},rcssescape=/([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,fcssescape=function(ch,asCodePoint){if(asCodePoint){if(ch==="\0"){return"\uFFFD"}return ch.slice(0,-1)+"\\"+ch.charCodeAt(ch.length-1).toString(16)+" "}return"\\"+ch},unloadHandler=function(){setDocument()},inDisabledFieldset=addCombinator(function(elem){return elem.disabled===true&&elem.nodeName.toLowerCase()==="fieldset"},{dir:"parentNode",next:"legend"});try{push.apply((arr=slice.call(preferredDoc.childNodes)),preferredDoc.childNodes);arr[preferredDoc.childNodes.length].nodeType}catch(e){push={apply:arr.length?function(target,els){push_native.apply(target,slice.call(els))}:function(target,els){var j=target.length,i=0;while((target[j++]=els[i++])){}target.length=j-1}}}function Sizzle(selector,context,results,seed){var m,i,elem,nid,match,groups,newSelector,newContext=context&&context.ownerDocument,nodeType=context?context.nodeType:9;results=results||[];if(typeof selector!=="string"||!selector||nodeType!==1&&nodeType!==9&&nodeType!==11){return results}if(!seed){if((context?context.ownerDocument||context:preferredDoc)!==document){setDocument(context)}context=context||document;if(documentIsHTML){if(nodeType!==11&&(match=rquickExpr.exec(selector))){if((m=match[1])){if(nodeType===9){if((elem=context.getElementById(m))){if(elem.id===m){results.push(elem);return results}}else{return results}}else{if(newContext&&(elem=newContext.getElementById(m))&&contains(context,elem)&&elem.id===m){results.push(elem);return results}}}else if(match[2]){push.apply(results,context.getElementsByTagName(selector));return results}else if((m=match[3])&&support.getElementsByClassName&&context.getElementsByClassName){push.apply(results,context.getElementsByClassName(m));return results}}if(support.qsa&&!compilerCache[selector+" "]&&(!rbuggyQSA||!rbuggyQSA.test(selector))){if(nodeType!==1){newContext=context;newSelector=selector}else if(context.nodeName.toLowerCase()!=="object"){if((nid=context.getAttribute("id"))){nid=nid.replace(rcssescape,fcssescape)}else{context.setAttribute("id",(nid=expando))}groups=tokenize(selector);i=groups.length;while(i--){groups[i]="#"+nid+" "+toSelector(groups[i])}newSelector=groups.join(",");newContext=rsibling.test(selector)&&testContext(context.parentNode)||context}if(newSelector){try{push.apply(results,newContext.querySelectorAll(newSelector));return results}catch(qsaError){}finally{if(nid===expando){context.removeAttribute("id")}}}}}}return select(selector.replace(rtrim,"$1"),context,results,seed)}function createCache(){var keys=[];function cache(key,value){if(keys.push(key+" ")>Expr.cacheLength){delete cache[keys.shift()]}return(cache[key+" "]=value)}return cache}function markFunction(fn){fn[expando]=true;return fn}function assert(fn){var el=document.createElement("fieldset");try{return!!fn(el)}catch(e){return false}finally{if(el.parentNode){el.parentNode.removeChild(el)}el=null}}function addHandle(attrs,handler){var arr=attrs.split("|"),i=arr.length;while(i--){Expr.attrHandle[arr[i]]=handler}}function siblingCheck(a,b){var cur=b&&a,diff=cur&&a.nodeType===1&&b.nodeType===1&&a.sourceIndex-b.sourceIndex;if(diff){return diff}if(cur){while((cur=cur.nextSibling)){if(cur===b){return-1}}}return a?1:-1}function createInputPseudo(type){return function(elem){var name=elem.nodeName.toLowerCase();return name==="input"&&elem.type===type}}function createButtonPseudo(type){return function(elem){var name=elem.nodeName.toLowerCase();return(name==="input"||name==="button")&&elem.type===type}}function createDisabledPseudo(disabled){return function(elem){if("form"in elem){if(elem.parentNode&&elem.disabled===false){if("label"in elem){if("label"in elem.parentNode){return elem.parentNode.disabled===disabled}else{return elem.disabled===disabled}}return elem.isDisabled===disabled||elem.isDisabled!==!disabled&&inDisabledFieldset(elem)===disabled}return elem.disabled===disabled}else if("label"in elem){return elem.disabled===disabled}return false}}function createPositionalPseudo(fn){return markFunction(function(argument){argument=+argument;return markFunction(function(seed,matches){var j,matchIndexes=fn([],seed.length,argument),i=matchIndexes.length;while(i--){if(seed[(j=matchIndexes[i])]){seed[j]=!(matches[j]=seed[j])}}})})}function testContext(context){return context&&typeof context.getElementsByTagName!=="undefined"&&context}support=Sizzle.support={};isXML=Sizzle.isXML=function(elem){var documentElement=elem&&(elem.ownerDocument||elem).documentElement;return documentElement?documentElement.nodeName!=="HTML":false};setDocument=Sizzle.setDocument=function(node){var hasCompare,subWindow,doc=node?node.ownerDocument||node:preferredDoc;if(doc===document||doc.nodeType!==9||!doc.documentElement){return document}document=doc;docElem=document.documentElement;documentIsHTML=!isXML(document);if(preferredDoc!==document&&(subWindow=document.defaultView)&&subWindow.top!==subWindow){if(subWindow.addEventListener){subWindow.addEventListener("unload",unloadHandler,false)}else if(subWindow.attachEvent){subWindow.attachEvent("onunload",unloadHandler)}}support.attributes=assert(function(el){el.className="i";return!el.getAttribute("className")});support.getElementsByTagName=assert(function(el){el.appendChild(document.createComment(""));return!el.getElementsByTagName("*").length});support.getElementsByClassName=rnative.test(document.getElementsByClassName);support.getById=assert(function(el){docElem.appendChild(el).id=expando;return!document.getElementsByName||!document.getElementsByName(expando).length});if(support.getById){Expr.filter["ID"]=function(id){var attrId=id.replace(runescape,funescape);return function(elem){return elem.getAttribute("id")===attrId}};Expr.find["ID"]=function(id,context){if(typeof context.getElementById!=="undefined"&&documentIsHTML){var elem=context.getElementById(id);return elem?[elem]:[]}}}else{Expr.filter["ID"]=function(id){var attrId=id.replace(runescape,funescape);return function(elem){var node=typeof elem.getAttributeNode!=="undefined"&&elem.getAttributeNode("id");return node&&node.value===attrId}};Expr.find["ID"]=function(id,context){if(typeof context.getElementById!=="undefined"&&documentIsHTML){var node,i,elems,elem=context.getElementById(id);if(elem){node=elem.getAttributeNode("id");if(node&&node.value===id){return[elem]}elems=context.getElementsByName(id);i=0;while((elem=elems[i++])){node=elem.getAttributeNode("id");if(node&&node.value===id){return[elem]}}}return[]}}}Expr.find["TAG"]=support.getElementsByTagName?function(tag,context){if(typeof context.getElementsByTagName!=="undefined"){return context.getElementsByTagName(tag)}else if(support.qsa){return context.querySelectorAll(tag)}}:function(tag,context){var elem,tmp=[],i=0,results=context.getElementsByTagName(tag);if(tag==="*"){while((elem=results[i++])){if(elem.nodeType===1){tmp.push(elem)}}return tmp}return results};Expr.find["CLASS"]=support.getElementsByClassName&&function(className,context){if(typeof context.getElementsByClassName!=="undefined"&&documentIsHTML){return context.getElementsByClassName(className)}};rbuggyMatches=[];rbuggyQSA=[];if((support.qsa=rnative.test(document.querySelectorAll))){assert(function(el){docElem.appendChild(el).innerHTML="<a id='"+expando+"'></a>"+"<select id='"+expando+"-\r\\' msallowcapture=''>"+"<option selected=''></option></select>";if(el.querySelectorAll("[msallowcapture^='']").length){rbuggyQSA.push("[*^$]="+whitespace+"*(?:''|\"\")")}if(!el.querySelectorAll("[selected]").length){rbuggyQSA.push("\\["+whitespace+"*(?:value|"+booleans+")")}if(!el.querySelectorAll("[id~="+expando+"-]").length){rbuggyQSA.push("~=")}if(!el.querySelectorAll(":checked").length){rbuggyQSA.push(":checked")}if(!el.querySelectorAll("a#"+expando+"+*").length){rbuggyQSA.push(".#.+[+~]")}});assert(function(el){el.innerHTML="<a href='' disabled='disabled'></a>"+"<select disabled='disabled'><option/></select>";var input=document.createElement("input");input.setAttribute("type","hidden");el.appendChild(input).setAttribute("name","D");if(el.querySelectorAll("[name=d]").length){rbuggyQSA.push("name"+whitespace+"*[*^$|!~]?=")}if(el.querySelectorAll(":enabled").length!==2){rbuggyQSA.push(":enabled",":disabled")}docElem.appendChild(el).disabled=true;if(el.querySelectorAll(":disabled").length!==2){rbuggyQSA.push(":enabled",":disabled")}el.querySelectorAll("*,:x");rbuggyQSA.push(",.*:")})}if((support.matchesSelector=rnative.test((matches=docElem.matches||docElem.webkitMatchesSelector||docElem.mozMatchesSelector||docElem.oMatchesSelector||docElem.msMatchesSelector)))){assert(function(el){support.disconnectedMatch=matches.call(el,"*");matches.call(el,"[s!='']:x");rbuggyMatches.push("!=",pseudos)})}rbuggyQSA=rbuggyQSA.length&&new RegExp(rbuggyQSA.join("|"));rbuggyMatches=rbuggyMatches.length&&new RegExp(rbuggyMatches.join("|"));hasCompare=rnative.test(docElem.compareDocumentPosition);contains=hasCompare||rnative.test(docElem.contains)?function(a,b){var adown=a.nodeType===9?a.documentElement:a,bup=b&&b.parentNode;return a===bup||!!(bup&&bup.nodeType===1&&(adown.contains?adown.contains(bup):a.compareDocumentPosition&&a.compareDocumentPosition(bup)&16))}:function(a,b){if(b){while((b=b.parentNode)){if(b===a){return true}}}return false};sortOrder=hasCompare?function(a,b){if(a===b){hasDuplicate=true;return 0}var compare=!a.compareDocumentPosition-!b.compareDocumentPosition;if(compare){return compare}compare=(a.ownerDocument||a)===(b.ownerDocument||b)?a.compareDocumentPosition(b):1;if(compare&1||(!support.sortDetached&&b.compareDocumentPosition(a)===compare)){if(a===document||a.ownerDocument===preferredDoc&&contains(preferredDoc,a)){return-1}if(b===document||b.ownerDocument===preferredDoc&&contains(preferredDoc,b)){return 1}return sortInput?(indexOf(sortInput,a)-indexOf(sortInput,b)):0}return compare&4?-1:1}:function(a,b){if(a===b){hasDuplicate=true;return 0}var cur,i=0,aup=a.parentNode,bup=b.parentNode,ap=[a],bp=[b];if(!aup||!bup){return a===document?-1:b===document?1:aup?-1:bup?1:sortInput?(indexOf(sortInput,a)-indexOf(sortInput,b)):0}else if(aup===bup){return siblingCheck(a,b)}cur=a;while((cur=cur.parentNode)){ap.unshift(cur)}cur=b;while((cur=cur.parentNode)){bp.unshift(cur)}while(ap[i]===bp[i]){i++}return i?siblingCheck(ap[i],bp[i]):ap[i]===preferredDoc?-1:bp[i]===preferredDoc?1:0};return document};Sizzle.matches=function(expr,elements){return Sizzle(expr,null,null,elements)};Sizzle.matchesSelector=function(elem,expr){if((elem.ownerDocument||elem)!==document){setDocument(elem)}expr=expr.replace(rattributeQuotes,"='$1']");if(support.matchesSelector&&documentIsHTML&&!compilerCache[expr+" "]&&(!rbuggyMatches||!rbuggyMatches.test(expr))&&(!rbuggyQSA||!rbuggyQSA.test(expr))){try{var ret=matches.call(elem,expr);if(ret||support.disconnectedMatch||elem.document&&elem.document.nodeType!==11){return ret}}catch(e){}}return Sizzle(expr,document,null,[elem]).length>0};Sizzle.contains=function(context,elem){if((context.ownerDocument||context)!==document){setDocument(context)}return contains(context,elem)};Sizzle.attr=function(elem,name){if((elem.ownerDocument||elem)!==document){setDocument(elem)}var fn=Expr.attrHandle[name.toLowerCase()],val=fn&&hasOwn.call(Expr.attrHandle,name.toLowerCase())?fn(elem,name,!documentIsHTML):undefined;return val!==undefined?val:support.attributes||!documentIsHTML?elem.getAttribute(name):(val=elem.getAttributeNode(name))&&val.specified?val.value:null};Sizzle.escape=function(sel){return(sel+"").replace(rcssescape,fcssescape)};Sizzle.error=function(msg){throw new Error("Syntax error, unrecognized expression: "+msg);};Sizzle.uniqueSort=function(results){var elem,duplicates=[],j=0,i=0;hasDuplicate=!support.detectDuplicates;sortInput=!support.sortStable&&results.slice(0);results.sort(sortOrder);if(hasDuplicate){while((elem=results[i++])){if(elem===results[i]){j=duplicates.push(i)}}while(j--){results.splice(duplicates[j],1)}}sortInput=null;return results};getText=Sizzle.getText=function(elem){var node,ret="",i=0,nodeType=elem.nodeType;if(!nodeType){while((node=elem[i++])){ret+=getText(node)}}else if(nodeType===1||nodeType===9||nodeType===11){if(typeof elem.textContent==="string"){return elem.textContent}else{for(elem=elem.firstChild;elem;elem=elem.nextSibling){ret+=getText(elem)}}}else if(nodeType===3||nodeType===4){return elem.nodeValue}return ret};Expr=Sizzle.selectors={cacheLength:50,createPseudo:markFunction,match:matchExpr,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:true}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:true},"~":{dir:"previousSibling"}},preFilter:{"ATTR":function(match){match[1]=match[1].replace(runescape,funescape);match[3]=(match[3]||match[4]||match[5]||"").replace(runescape,funescape);if(match[2]==="~="){match[3]=" "+match[3]+" "}return match.slice(0,4)},"CHILD":function(match){match[1]=match[1].toLowerCase();if(match[1].slice(0,3)==="nth"){if(!match[3]){Sizzle.error(match[0])}match[4]=+(match[4]?match[5]+(match[6]||1):2*(match[3]==="even"||match[3]==="odd"));match[5]=+((match[7]+match[8])||match[3]==="odd")}else if(match[3]){Sizzle.error(match[0])}return match},"PSEUDO":function(match){var excess,unquoted=!match[6]&&match[2];if(matchExpr["CHILD"].test(match[0])){return null}if(match[3]){match[2]=match[4]||match[5]||""}else if(unquoted&&rpseudo.test(unquoted)&&(excess=tokenize(unquoted,true))&&(excess=unquoted.indexOf(")",unquoted.length-excess)-unquoted.length)){match[0]=match[0].slice(0,excess);match[2]=unquoted.slice(0,excess)}return match.slice(0,3)}},filter:{"TAG":function(nodeNameSelector){var nodeName=nodeNameSelector.replace(runescape,funescape).toLowerCase();return nodeNameSelector==="*"?function(){return true}:function(elem){return elem.nodeName&&elem.nodeName.toLowerCase()===nodeName}},"CLASS":function(className){var pattern=classCache[className+" "];return pattern||(pattern=new RegExp("(^|"+whitespace+")"+className+"("+whitespace+"|$)"))&&classCache(className,function(elem){return pattern.test(typeof elem.className==="string"&&elem.className||typeof elem.getAttribute!=="undefined"&&elem.getAttribute("class")||"")})},"ATTR":function(name,operator,check){return function(elem){var result=Sizzle.attr(elem,name);if(result==null){return operator==="!="}if(!operator){return true}result+="";return operator==="="?result===check:operator==="!="?result!==check:operator==="^="?check&&result.indexOf(check)===0:operator==="*="?check&&result.indexOf(check)>-1:operator==="$="?check&&result.slice(-check.length)===check:operator==="~="?(" "+result.replace(rwhitespace," ")+" ").indexOf(check)>-1:operator==="|="?result===check||result.slice(0,check.length+1)===check+"-":false}},"CHILD":function(type,what,argument,first,last){var simple=type.slice(0,3)!=="nth",forward=type.slice(-4)!=="last",ofType=what==="of-type";return first===1&&last===0?function(elem){return!!elem.parentNode}:function(elem,context,xml){var cache,uniqueCache,outerCache,node,nodeIndex,start,dir=simple!==forward?"nextSibling":"previousSibling",parent=elem.parentNode,name=ofType&&elem.nodeName.toLowerCase(),useCache=!xml&&!ofType,diff=false;if(parent){if(simple){while(dir){node=elem;while((node=node[dir])){if(ofType?node.nodeName.toLowerCase()===name:node.nodeType===1){return false}}start=dir=type==="only"&&!start&&"nextSibling"}return true}start=[forward?parent.firstChild:parent.lastChild];if(forward&&useCache){node=parent;outerCache=node[expando]||(node[expando]={});uniqueCache=outerCache[node.uniqueID]||(outerCache[node.uniqueID]={});cache=uniqueCache[type]||[];nodeIndex=cache[0]===dirruns&&cache[1];diff=nodeIndex&&cache[2];node=nodeIndex&&parent.childNodes[nodeIndex];while((node=++nodeIndex&&node&&node[dir]||(diff=nodeIndex=0)||start.pop())){if(node.nodeType===1&&++diff&&node===elem){uniqueCache[type]=[dirruns,nodeIndex,diff];break}}}else{if(useCache){node=elem;outerCache=node[expando]||(node[expando]={});uniqueCache=outerCache[node.uniqueID]||(outerCache[node.uniqueID]={});cache=uniqueCache[type]||[];nodeIndex=cache[0]===dirruns&&cache[1];diff=nodeIndex}if(diff===false){while((node=++nodeIndex&&node&&node[dir]||(diff=nodeIndex=0)||start.pop())){if((ofType?node.nodeName.toLowerCase()===name:node.nodeType===1)&&++diff){if(useCache){outerCache=node[expando]||(node[expando]={});uniqueCache=outerCache[node.uniqueID]||(outerCache[node.uniqueID]={});uniqueCache[type]=[dirruns,diff]}if(node===elem){break}}}}}diff-=last;return diff===first||(diff%first===0&&diff/first>=0)}}},"PSEUDO":function(pseudo,argument){var args,fn=Expr.pseudos[pseudo]||Expr.setFilters[pseudo.toLowerCase()]||Sizzle.error("unsupported pseudo: "+pseudo);if(fn[expando]){return fn(argument)}if(fn.length>1){args=[pseudo,pseudo,"",argument];return Expr.setFilters.hasOwnProperty(pseudo.toLowerCase())?markFunction(function(seed,matches){var idx,matched=fn(seed,argument),i=matched.length;while(i--){idx=indexOf(seed,matched[i]);seed[idx]=!(matches[idx]=matched[i])}}):function(elem){return fn(elem,0,args)}}return fn}},pseudos:{"not":markFunction(function(selector){var input=[],results=[],matcher=compile(selector.replace(rtrim,"$1"));return matcher[expando]?markFunction(function(seed,matches,context,xml){var elem,unmatched=matcher(seed,null,xml,[]),i=seed.length;while(i--){if((elem=unmatched[i])){seed[i]=!(matches[i]=elem)}}}):function(elem,context,xml){input[0]=elem;matcher(input,null,xml,results);input[0]=null;return!results.pop()}}),"has":markFunction(function(selector){return function(elem){return Sizzle(selector,elem).length>0}}),"contains":markFunction(function(text){text=text.replace(runescape,funescape);return function(elem){return(elem.textContent||elem.innerText||getText(elem)).indexOf(text)>-1}}),"lang":markFunction(function(lang){if(!ridentifier.test(lang||"")){Sizzle.error("unsupported lang: "+lang)}lang=lang.replace(runescape,funescape).toLowerCase();return function(elem){var elemLang;do{if((elemLang=documentIsHTML?elem.lang:elem.getAttribute("xml:lang")||elem.getAttribute("lang"))){elemLang=elemLang.toLowerCase();return elemLang===lang||elemLang.indexOf(lang+"-")===0}}while((elem=elem.parentNode)&&elem.nodeType===1);return false}}),"target":function(elem){var hash=window.location&&window.location.hash;return hash&&hash.slice(1)===elem.id},"root":function(elem){return elem===docElem},"focus":function(elem){return elem===document.activeElement&&(!document.hasFocus||document.hasFocus())&&!!(elem.type||elem.href||~elem.tabIndex)},"enabled":createDisabledPseudo(false),"disabled":createDisabledPseudo(true),"checked":function(elem){var nodeName=elem.nodeName.toLowerCase();return(nodeName==="input"&&!!elem.checked)||(nodeName==="option"&&!!elem.selected)},"selected":function(elem){if(elem.parentNode){elem.parentNode.selectedIndex}return elem.selected===true},"empty":function(elem){for(elem=elem.firstChild;elem;elem=elem.nextSibling){if(elem.nodeType<6){return false}}return true},"parent":function(elem){return!Expr.pseudos["empty"](elem)},"header":function(elem){return rheader.test(elem.nodeName)},"input":function(elem){return rinputs.test(elem.nodeName)},"button":function(elem){var name=elem.nodeName.toLowerCase();return name==="input"&&elem.type==="button"||name==="button"},"text":function(elem){var attr;return elem.nodeName.toLowerCase()==="input"&&elem.type==="text"&&((attr=elem.getAttribute("type"))==null||attr.toLowerCase()==="text")},"first":createPositionalPseudo(function(){return[0]}),"last":createPositionalPseudo(function(matchIndexes,length){return[length-1]}),"eq":createPositionalPseudo(function(matchIndexes,length,argument){return[argument<0?argument+length:argument]}),"even":createPositionalPseudo(function(matchIndexes,length){var i=0;for(;i<length;i+=2){matchIndexes.push(i)}return matchIndexes}),"odd":createPositionalPseudo(function(matchIndexes,length){var i=1;for(;i<length;i+=2){matchIndexes.push(i)}return matchIndexes}),"lt":createPositionalPseudo(function(matchIndexes,length,argument){var i=argument<0?argument+length:argument;for(;--i>=0;){matchIndexes.push(i)}return matchIndexes}),"gt":createPositionalPseudo(function(matchIndexes,length,argument){var i=argument<0?argument+length:argument;for(;++i<length;){matchIndexes.push(i)}return matchIndexes})}};Expr.pseudos["nth"]=Expr.pseudos["eq"];for(i in{radio:true,checkbox:true,file:true,password:true,image:true}){Expr.pseudos[i]=createInputPseudo(i)}for(i in{submit:true,reset:true}){Expr.pseudos[i]=createButtonPseudo(i)}function setFilters(){}setFilters.prototype=Expr.filters=Expr.pseudos;Expr.setFilters=new setFilters();tokenize=Sizzle.tokenize=function(selector,parseOnly){var matched,match,tokens,type,soFar,groups,preFilters,cached=tokenCache[selector+" "];if(cached){return parseOnly?0:cached.slice(0)}soFar=selector;groups=[];preFilters=Expr.preFilter;while(soFar){if(!matched||(match=rcomma.exec(soFar))){if(match){soFar=soFar.slice(match[0].length)||soFar}groups.push((tokens=[]))}matched=false;if((match=rcombinators.exec(soFar))){matched=match.shift();tokens.push({value:matched,type:match[0].replace(rtrim," ")});soFar=soFar.slice(matched.length)}for(type in Expr.filter){if((match=matchExpr[type].exec(soFar))&&(!preFilters[type]||(match=preFilters[type](match)))){matched=match.shift();tokens.push({value:matched,type:type,matches:match});soFar=soFar.slice(matched.length)}}if(!matched){break}}return parseOnly?soFar.length:soFar?Sizzle.error(selector):tokenCache(selector,groups).slice(0)};function toSelector(tokens){var i=0,len=tokens.length,selector="";for(;i<len;i++){selector+=tokens[i].value}return selector}function addCombinator(matcher,combinator,base){var dir=combinator.dir,skip=combinator.next,key=skip||dir,checkNonElements=base&&key==="parentNode",doneName=done++;return combinator.first?function(elem,context,xml){while((elem=elem[dir])){if(elem.nodeType===1||checkNonElements){return matcher(elem,context,xml)}}return false}:function(elem,context,xml){var oldCache,uniqueCache,outerCache,newCache=[dirruns,doneName];if(xml){while((elem=elem[dir])){if(elem.nodeType===1||checkNonElements){if(matcher(elem,context,xml)){return true}}}}else{while((elem=elem[dir])){if(elem.nodeType===1||checkNonElements){outerCache=elem[expando]||(elem[expando]={});uniqueCache=outerCache[elem.uniqueID]||(outerCache[elem.uniqueID]={});if(skip&&skip===elem.nodeName.toLowerCase()){elem=elem[dir]||elem}else if((oldCache=uniqueCache[key])&&oldCache[0]===dirruns&&oldCache[1]===doneName){return(newCache[2]=oldCache[2])}else{uniqueCache[key]=newCache;if((newCache[2]=matcher(elem,context,xml))){return true}}}}}return false}}function elementMatcher(matchers){return matchers.length>1?function(elem,context,xml){var i=matchers.length;while(i--){if(!matchers[i](elem,context,xml)){return false}}return true}:matchers[0]}function multipleContexts(selector,contexts,results){var i=0,len=contexts.length;for(;i<len;i++){Sizzle(selector,contexts[i],results)}return results}function condense(unmatched,map,filter,context,xml){var elem,newUnmatched=[],i=0,len=unmatched.length,mapped=map!=null;for(;i<len;i++){if((elem=unmatched[i])){if(!filter||filter(elem,context,xml)){newUnmatched.push(elem);if(mapped){map.push(i)}}}}return newUnmatched}function setMatcher(preFilter,selector,matcher,postFilter,postFinder,postSelector){if(postFilter&&!postFilter[expando]){postFilter=setMatcher(postFilter)}if(postFinder&&!postFinder[expando]){postFinder=setMatcher(postFinder,postSelector)}return markFunction(function(seed,results,context,xml){var temp,i,elem,preMap=[],postMap=[],preexisting=results.length,elems=seed||multipleContexts(selector||"*",context.nodeType?[context]:context,[]),matcherIn=preFilter&&(seed||!selector)?condense(elems,preMap,preFilter,context,xml):elems,matcherOut=matcher?postFinder||(seed?preFilter:preexisting||postFilter)?[]:results:matcherIn;if(matcher){matcher(matcherIn,matcherOut,context,xml)}if(postFilter){temp=condense(matcherOut,postMap);postFilter(temp,[],context,xml);i=temp.length;while(i--){if((elem=temp[i])){matcherOut[postMap[i]]=!(matcherIn[postMap[i]]=elem)}}}if(seed){if(postFinder||preFilter){if(postFinder){temp=[];i=matcherOut.length;while(i--){if((elem=matcherOut[i])){temp.push((matcherIn[i]=elem))}}postFinder(null,(matcherOut=[]),temp,xml)}i=matcherOut.length;while(i--){if((elem=matcherOut[i])&&(temp=postFinder?indexOf(seed,elem):preMap[i])>-1){seed[temp]=!(results[temp]=elem)}}}}else{matcherOut=condense(matcherOut===results?matcherOut.splice(preexisting,matcherOut.length):matcherOut);if(postFinder){postFinder(null,results,matcherOut,xml)}else{push.apply(results,matcherOut)}}})}function matcherFromTokens(tokens){var checkContext,matcher,j,len=tokens.length,leadingRelative=Expr.relative[tokens[0].type],implicitRelative=leadingRelative||Expr.relative[" "],i=leadingRelative?1:0,matchContext=addCombinator(function(elem){return elem===checkContext},implicitRelative,true),matchAnyContext=addCombinator(function(elem){return indexOf(checkContext,elem)>-1},implicitRelative,true),matchers=[function(elem,context,xml){var ret=(!leadingRelative&&(xml||context!==outermostContext))||((checkContext=context).nodeType?matchContext(elem,context,xml):matchAnyContext(elem,context,xml));checkContext=null;return ret}];for(;i<len;i++){if((matcher=Expr.relative[tokens[i].type])){matchers=[addCombinator(elementMatcher(matchers),matcher)]}else{matcher=Expr.filter[tokens[i].type].apply(null,tokens[i].matches);if(matcher[expando]){j=++i;for(;j<len;j++){if(Expr.relative[tokens[j].type]){break}}return setMatcher(i>1&&elementMatcher(matchers),i>1&&toSelector(tokens.slice(0,i-1).concat({value:tokens[i-2].type===" "?"*":""})).replace(rtrim,"$1"),matcher,i<j&&matcherFromTokens(tokens.slice(i,j)),j<len&&matcherFromTokens((tokens=tokens.slice(j))),j<len&&toSelector(tokens))}matchers.push(matcher)}}return elementMatcher(matchers)}function matcherFromGroupMatchers(elementMatchers,setMatchers){var bySet=setMatchers.length>0,byElement=elementMatchers.length>0,superMatcher=function(seed,context,xml,results,outermost){var elem,j,matcher,matchedCount=0,i="0",unmatched=seed&&[],setMatched=[],contextBackup=outermostContext,elems=seed||byElement&&Expr.find["TAG"]("*",outermost),dirrunsUnique=(dirruns+=contextBackup==null?1:Math.random()||0.1),len=elems.length;if(outermost){outermostContext=context===document||context||outermost}for(;i!==len&&(elem=elems[i])!=null;i++){if(byElement&&elem){j=0;if(!context&&elem.ownerDocument!==document){setDocument(elem);xml=!documentIsHTML}while((matcher=elementMatchers[j++])){if(matcher(elem,context||document,xml)){results.push(elem);break}}if(outermost){dirruns=dirrunsUnique}}if(bySet){if((elem=!matcher&&elem)){matchedCount--}if(seed){unmatched.push(elem)}}}matchedCount+=i;if(bySet&&i!==matchedCount){j=0;while((matcher=setMatchers[j++])){matcher(unmatched,setMatched,context,xml)}if(seed){if(matchedCount>0){while(i--){if(!(unmatched[i]||setMatched[i])){setMatched[i]=pop.call(results)}}}setMatched=condense(setMatched)}push.apply(results,setMatched);if(outermost&&!seed&&setMatched.length>0&&(matchedCount+setMatchers.length)>1){Sizzle.uniqueSort(results)}}if(outermost){dirruns=dirrunsUnique;outermostContext=contextBackup}return unmatched};return bySet?markFunction(superMatcher):superMatcher}compile=Sizzle.compile=function(selector,match){var i,setMatchers=[],elementMatchers=[],cached=compilerCache[selector+" "];if(!cached){if(!match){match=tokenize(selector)}i=match.length;while(i--){cached=matcherFromTokens(match[i]);if(cached[expando]){setMatchers.push(cached)}else{elementMatchers.push(cached)}}cached=compilerCache(selector,matcherFromGroupMatchers(elementMatchers,setMatchers));cached.selector=selector}return cached};select=Sizzle.select=function(selector,context,results,seed){var i,tokens,token,type,find,compiled=typeof selector==="function"&&selector,match=!seed&&tokenize((selector=compiled.selector||selector));results=results||[];if(match.length===1){tokens=match[0]=match[0].slice(0);if(tokens.length>2&&(token=tokens[0]).type==="ID"&&context.nodeType===9&&documentIsHTML&&Expr.relative[tokens[1].type]){context=(Expr.find["ID"](token.matches[0].replace(runescape,funescape),context)||[])[0];if(!context){return results}else if(compiled){context=context.parentNode}selector=selector.slice(tokens.shift().value.length)}i=matchExpr["needsContext"].test(selector)?0:tokens.length;while(i--){token=tokens[i];if(Expr.relative[(type=token.type)]){break}if((find=Expr.find[type])){if((seed=find(token.matches[0].replace(runescape,funescape),rsibling.test(tokens[0].type)&&testContext(context.parentNode)||context))){tokens.splice(i,1);selector=seed.length&&toSelector(tokens);if(!selector){push.apply(results,seed);return results}break}}}}(compiled||compile(selector,match))(seed,context,!documentIsHTML,results,!context||rsibling.test(selector)&&testContext(context.parentNode)||context);return results};support.sortStable=expando.split("").sort(sortOrder).join("")===expando;support.detectDuplicates=!!hasDuplicate;setDocument();support.sortDetached=assert(function(el){return el.compareDocumentPosition(document.createElement("fieldset"))&1});if(!assert(function(el){el.innerHTML="<a href='#'></a>";return el.firstChild.getAttribute("href")==="#"})){addHandle("type|href|height|width",function(elem,name,isXML){if(!isXML){return elem.getAttribute(name,name.toLowerCase()==="type"?1:2)}})}if(!support.attributes||!assert(function(el){el.innerHTML="<input/>";el.firstChild.setAttribute("value","");return el.firstChild.getAttribute("value")===""})){addHandle("value",function(elem,name,isXML){if(!isXML&&elem.nodeName.toLowerCase()==="input"){return elem.defaultValue}})}if(!assert(function(el){return el.getAttribute("disabled")==null})){addHandle(booleans,function(elem,name,isXML){var val;if(!isXML){return elem[name]===true?name.toLowerCase():(val=elem.getAttributeNode(name))&&val.specified?val.value:null}})}return Sizzle})(window));