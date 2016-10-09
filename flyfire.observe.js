;(function(w,d,ff,o){
		var OI8 = ff.OI8;
    var OI8Select = ff.OI8Select;
    var UUID = ff.UUID;
    var each = ff.each;
    var RawType = ff.RawType;
    var slice = Array.prototype.slice;
    var fieldAccessor = function(instance,accessors,name,value){
        if(arguments.length===4){
            accessors[name].set.call(instance,value);
        }else{
            return accessors[name].get.call(instance);
        }
    };
    var methodAccessor = OI8Select(function(instance,accessors,name,args){
        return accessors[name].apply(instance,args);
    },function(instance,accessors,name){
        return accessors[name].apply(instance,slice.call(arguments,3));
    });
    var	proxy = ff.proxy = OI8Select((function(def){
        var JsObjectProxy = function(instance,accessors,fieldAccessor,methodAccessor){
            this.__inst__ = instance;
            this.__accs__ = accessors;
            this.__facc__ = fieldAccessor;
            this.__macc__ = methodAccessor;
        };
        JsObjectProxy.prototype.fieldDesc = function(){
            var self = this;
            var desc = {};
            each(this.__inst__,function(){
                var key = this.key;
                desc[key] = {};
                if(key in self.__accs__){
                    self.__accs__[key].get&&(desc[key].get=function(){
                        return this.__facc__(this.__inst__,this.__accs__,key);
                    });
                    self.__accs__[key].set&&(desc[key].set=function(val){
                        this.__facc__(this.__inst__,this.__accs__,key,val);
                    });
                }else{
                    desc[key].get=function(){
                        return this.__inst__[key];
                    };
                    desc[key].set=function(val){
                        this.__inst__[key] = val;
                    };
                }
            },function(){
                var key = this.key;
                if(RawType.Function.has(this.value)){
                    self.__accs__[key] = this.value;
                    self[key] = function(){
                        return this.__macc__(this.__inst__,this.__accs__,key,arguments);
                    };
                    return false;
                }else{
                    return true;
                }
            });
            return desc;
        };
        return function(instance,accessors){
            var jopxy = new JsObjectProxy(instance,accessors,fieldAccessor,methodAccessor);
            return def(jopxy,jopxy.fieldDesc());
        };

    })(o.defineProperties),OI8&&(function(){
        w.execScript([
            "Function parseVB(code)",
            "\tExecuteGlobal(code)",
            "End Function"
        ].join("\r\n"), "VBScript");
        var buildArgString = function(argCnt){
            var args = [];
            for(var i = 0;i<argCnt;i++){
                args.push("arg"+i);
            };
            return args.join(",");
        };
        var JsObjectProxy = function(instance,accessors,fieldAccessor,methodAccessor){
            this.inst = instance;
            this.accs = accessors;
            this.facc = fieldAccessor;
            this.macc = methodAccessor;
            this.className = ("VBClass"+UUID());
            this.buffer = [
                "Class "+this.className,
                "\tPrivate inst,accs,facc,macc",
                "\tPublic Default Function VBConstructor(o, a, fc, mc)",
                "\t\tSet inst = o : set accs = a : set facc = fc : set macc = mc ",
                "\t\tSet VBConstructor = Me",
                "\tEnd Function"
            ];
        };
        JsObjectProxy.prototype.fieldBuild = function(){
            var self = this;
            each(this.inst,function(){
                var key = this.key;
                if(!(key in self.accs)){
                    self.accs[key] = {
                        get : function(){
                            return this[key];
                        },
                        set : function(val){
                            this[key] = val;
                        }
                    };
                }
                self.accs[key].get&&self.buffer.push(
                    "\tPublic Property Get " + key + "",
                    "\tOn Error Resume Next",
                    "\t\tSet " + key + " = facc(inst,accs,\"" + key + "\")",
                    "\tIf Err.Number <> 0 Then",
                    "\t\t" + key + " = facc(inst,accs,\"" + key + "\")",
                    "\tEnd If",
                    "\tOn Error Goto 0",
                    "\tEnd Property"
                );
                self.accs[key].set&&self.buffer.push(
                    "\tPublic Property Let " + key + "(val)",
                    "\t\tCall facc(inst,accs, \"" + key + "\", val)",
                    "\tEnd Property",
                    "\tPublic Property Set " + key + "(val)",
                    "\t\tCall facc(inst,accs, \"" + key + "\", val)",
                    "\tEnd Property"
                );
            },function(){
                var key = this.key;
                if(RawType.Function.has(this.value)){
                    self.accs[key] = this.value;
                    var fArgStr = buildArgString(this.value.length);
                    var aArgStr = fArgStr === ""?"":(","+fArgStr);
                    self.buffer.push(
                        "\tPublic Function " + key + "("+fArgStr+")",
                        "\tOn Error Resume Next",
                        "\t\tSet " + key + " = macc(inst,accs,\"" + key + "\""+aArgStr+")",
                        "\tIf Err.Number <> 0 Then",
                        "\t\t" + key + " = macc(inst,accs,\"" + key + "\""+aArgStr+")",
                        "\tEnd If",
                        "\tOn Error Goto 0",
                        "\tEnd Function"
                    );
                    return false;
                }else{
                    return true;
                }
            });
            self.accs["constructor"] = {
                get : function(){
                    return this["constructor"];
                }
            }
            self.buffer.push(
                "\tPublic Property Get constructor",
                "\tOn Error Resume Next",
                "\t\tSet constructor = facc(inst,accs,\"constructor\")",
                "\tIf Err.Number <> 0 Then",
                "\t\tconstructor = facc(inst,accs,\"constructor\")",
                "\tEnd If",
                "\tOn Error Goto 0",
                "\tEnd Property"
            );
        };
        JsObjectProxy.prototype.create = function(){
            this.fieldBuild();
            this.buffer.push(
                "\tPublic Function serialize ()",
                "\t\tserialize = window.stringify(JSObject)",
                "\tEnd Function",
                "End Class"
            );
            w.parseVB(this.buffer.join("\r\n"));
            w.parseVB([
                "Function " + this.className + "Factory(inst,accs,facc,macc)",
                "\tDim result",
                "\tSet result = (New " + this.className + ")(inst,accs,facc,macc)",
                "\tSet " + this.className + "Factory = result",
                "End Function"
            ].join("\r\n"));
            return w[this.className + "Factory"](this.inst,this.accs,this.facc,this.macc);
        };
        return function(instance,accessors){
            return new JsObjectProxy(instance,accessors,fieldAccessor,methodAccessor).create();
        };
    })()).vldParam({0:"Object",1:"Object"});

    /**
     * event{
					*		target: object
					*		trigger: key
					*		oldValue:	object[key] @before set access
					*		newValue:	object[key] @after set access
					*		value: object[key] @before get access
					*		type:	set/get
					*}
     */
		var mockInstance = {};
    var mockContext = {};

    var mockObject = function(instance){
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
                    },function(){
                    		return 	RawType.Function.has(this.value);
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
                    },function(){
                    		return 	RawType.Function.has(this.value);
                    });
                    this[key] = value;
                }
            })(this.key,hooks.set);
        },function(){
            return !RawType.Function.has(this.value);
        });
        var $pxy = mockInstance[instance.hashCode()] = proxy(instance,accessors);
        each($pxy,function(){
        	$pxy[this.key] = mock(this.value);
        },function(){
            return !RawType.Function.has(this.value);
        });
        return $pxy;
    };
    /**
     * event{
					*		target: array
					*		trigger: index
					*		items: items
					*		type:	add/del/srt
					*}
     */
    //var mockArrayMethods = ["pop","push","reverse","shift","sort","splice","unshift"];
    var mockArray = function(instance){
    	var context = mockContext[instance.hashCode()] = {
    			add:{log:function(e){console.log(e);}},
    			del:{log:function(e){console.log(e);}},
    			srt:{log:function(e){console.log(e);}},
    			get:{log:function(e){console.log(e);}},
					set:{log:function(e){console.log(e);}},
    	};
    	instance.pop = instance.pop.after(function(jp){
    		var mockEvent = {type:"del",target:this,trigger:this.length,items:[jp.result]};
    		each(context.del,function(){
                (this.value)(mockEvent);
            },function(){
            	return 	RawType.Function.has(this.value);
            });
    	});
    	instance.push = instance.push.before(function(jp){
    		var mockEvent = {type:"add",target:this,trigger:this.length,items:jp.args};
    		each(context.add,function(){
                (this.value)(mockEvent);
            },function(){
            	return 	RawType.Function.has(this.value);
            });
    	});
    	instance.reverse = instance.reverse.after(function(jp){
    		var mockEvent = {type:"srt",target:this,trigger:0,items:this};
    		each(context.srt,function(){
                (this.value)(mockEvent);
            },function(){
            	return 	RawType.Function.has(this.value);
            });
    	});
    	instance.shift = instance.shift.after(function(jp){
    		var mockEvent = {type:"del",target:this,trigger:0,items:[jp.result]};
    		each(context.del,function(){
                (this.value)(mockEvent);
            },function(){
            	return 	RawType.Function.has(this.value);
            });
    	});
    	instance.sort = instance.sort.after(function(jp){
    		var mockEvent = {type:"srt",target:this,trigger:0,items:this};
    		each(context.srt,function(){
                (this.value)(mockEvent);
            },function(){
            	return 	RawType.Function.has(this.value);
            });
    	});
    	instance.splice = instance.splice.around(function(jp){
    		var mockEventAdd = {type:"add",target:this,trigger:jp.args[0],items:slice.call(jp.args,2)};
    		var result = jp.invoke();
    		var mockEventDel = {type:"del",target:this,trigger:jp.args[0],items:result};
    		each(context.del,function(){
                (this.value)(mockEventDel);
            },function(){
            	return 	RawType.Function.has(this.value);
            });
    		each(context.add,function(){
                (this.value)(mockEventAdd);
            },function(){
            	return 	RawType.Function.has(this.value);
            });
    		return result;
    	});
    	instance.unshift = instance.unshift.before(function(jp){
    		var mockEvent = {type:"add",target:this,trigger:0,items:jp.args};
    		each(context.add,function(){
                (this.value)(mockEvent);
            },function(){
            	return 	RawType.Function.has(this.value);
            });
    	});
    	instance.get = instance.get.around(function(jp){
    		var result = jp.invoke();
    		var mockEvent = {type:"get",target:this,trigger:jp.args[0],value:result};
    		each(context.get,function(){
                (this.value)(mockEvent);
            },function(){
            	return 	RawType.Function.has(this.value);
            });
        return result;
    	});
    	instance.set = instance.set.after(function(jp){
    		var mockEvent = {type:"set",target:this,trigger:jp.args[0],oldValue:this[jp.args[0]],newValue:jp.args[1]};
    		each(context.set,function(){
                (this.value)(mockEvent);
            },function(){
            	return 	RawType.Function.has(this.value);
            });
    	});
    	var $pxy = mockInstance[instance.hashCode()] = instance;
    	each($pxy,function(i){
    		$pxy[i] = mock(this);
    	});
    	return $pxy;
    };

    var mock = ff.mock = function(instance){
    	if((instance&&instance.hashCode()) in mockInstance){
    		return mockInstance[instance.hashCode()];
			}else{
				if(RawType.Object.has(instance)){
					return mockObject(instance);
				}else if(RawType.Array.has(instance)){
					return mockArray(instance);
				}else{
					return instance;
				}	
			}
    };
    var Association = ff.Association = function(ass){
    	this.exp = /(\.{0,1}([a-zA-Z0-9_]{1,}))|(\[([0-9]{1,})\])/g;
    	this.ass = ass||"";
    	this.cached = null;
    	this.paths = null;
    }.asCtor("Association");
    Association.prototype.hasNext = function(){
    	return this.cached = this.exp.exec(this.ass);
    };
    Association.prototype.next = function(){
    	var path = "";
    	each(this.cached,function(){
    		path = this;
    	},function(){
    		return this!=="";
    	});
    	return path;
    };
    Association.prototype.all = function(){
    	if(this.paths){
    		return this.paths
    	}else{
	    	var paths = [];
	    	while(this.hasNext()){
	    		paths.push(this.next());	
	    	}
	    	return this.paths = paths;
    	}
    };
    Association.prototype.valueOf = function(instance){
    	var cursor = instance;
    	var paths = this.all();
    	for(var i = 0;i<paths.length-1;i++){
			cursor = cursor[paths[i]];	
			if(!cursor)return cursor;
		}
    	return paths.length&&cursor?cursor[paths[paths.length-1]]:cursor;
    };
    Association.prototype.exists = function(instance){
    	var paths = this.all();
    	return paths[0] in instance;
    };
    var observe = ff.observe = function(instance,type,func,ass){
    		var cursor = instance;
    		var assn = RawType.Association.has(ass)?ass:new Association(ass);
    		var paths = assn.all();
    		for(var i = 0;i<paths.length-1;i++){
    			cursor = cursor[paths[i]];	
    		}
    		(paths.length
    			?mockContext[cursor.hashCode()][paths[paths.length-1]][type]
    			:mockContext[cursor.hashCode()][type])
    		[func.hashCode()] = func;
    };
})(window,document,flyfire,Object);
