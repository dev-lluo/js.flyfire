;(function(w,d){
    var ff = w.flyfire = {};
    var OI8 = ff.OI8 = (w==d&&d!=w);
    var OI8Select = ff.OI8Select = function(a,b){
        return OI8?b:a;
    };
    var KeyWord = ff.KeyWord = /^(hashCode|derivedFrom|getType)$/;
    var I64BIT_TABLE =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var UUID = ff.UUID = function(){
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
        return this.hash||(this.hash = String(this).hashCode());
    };
    Object.prototype.hashCode = function(){
        if(this.hash){
            return this.hash;
        }else{
            var hash = [];
            for(var key in this){
                hash.push(key.hashCode());
                var type = RawType(this[key]);
                if(RawType.Object === type||RawType.Array === type){
                    if(arguments[0]){
                        hash.push(type);
                    }else{
                        hash.push(this[key].hashCode(true));
                    }
                }else if(RawType.String === type){
                    hash.push(this[key].hashCode());
                }else{
                    hash.push(String(this[key]).hashCode());
                }
            }
            hash.push(UUID());
            return this.hash = hash.join("").hashCode();
        }
    };
    Object.prototype.derivedFrom = function(typeName){
        return RawType[typeName].has(this);
    };
    Object.prototype.getType = function(){
    		return RawType(this);
    };
    Array.prototype.hashCode = function(){
        if(this.hash)
            return this.hash;
        else{
            var hash = [];
            for(var i = 0;i<this.length;i++){
                hash.push(i);
                var type = RawType(this[i]);
                if(RawType.Object === type||RawType.Array === type){
                    if(arguments[0]){
                        hash.push(type);
                    }else{
                        hash.push(this[i].hashCode(true));
                    }
                }else if(RawType.String === type){
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
    };
    RegExp.prototype.restore = OI8Select(function(){
				this.lastIndex = 0;
		},function(){
				while(this.exec()!=null);//IE8下不能使用this.lastIndex开始重新检索新字符串
		});
		Function.prototype.hashCode = function(){
				return this.hash||(this.hash = String(this).replace(/([\r\n])\s*/g,"").hashCode());
		};
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
    Function.prototype.asCtor = function(name){
        RawType.loadType(name,this);
        return this;
    };
    Function.prototype.vldParam = function(define){
        this.vld = define;
        var __self = this;
        return function(){
            for(var i = 0;i < arguments.length;i++){
                __self.vld[i]&&assertType(arguments[i],RawType[__self.vld[i]],false,"args["+i+"]@"+__self.vld[i]);
            }
            return __self.apply(this,arguments);
        };
    };
    Function.prototype.vldResult = function(define){
        this.vld = define;
        var __self = this;
        return function(){
            var ret = __self.apply(this,arguments);
            assertType(ret,RawType[__self.vld]);
            return ret;
        };
    };
    var O2Type = w.Object.prototype.toString.after(function(jp){
        jp.result = RawType.valueOf(jp.result);
    });
    var RawType = ff.RawType = function(obj){
        return obj===undefined
            ?RawType.Undefined
            :obj===null
            ?RawType.Null
            :obj.constructor.isCtor
            ?obj.constructor.type
            :O2Type.call(obj);
    };
    RawType.dm = RawType.prototype;
    RawType.dm.has = function(obj)	{
        return this === RawType(obj);
    };
    RawType.dm.toString = function(){
        return this.typeName;
    };
    RawType.dm.init = function(typeName,cached){
        this.typeName = typeName;
        this.cached = cached;
    };
    RawType.dm.init.prototype = RawType.dm;
    RawType.loadType = function(typeName,ctor){
        if(typeName in RawType)
            throw typeName+" is registered";
        RawType[typeName] = new RawType.dm.init(typeName,ctor);
        RawType[RawType[typeName]] = RawType[typeName];
        if(ctor){
            ctor.isCtor = true;
            ctor.ctorId = String(this).hashCode();
            ctor.type = RawType[typeName];
        }
        return RawType[typeName];
    };
    RawType.valueOf = function(str){
        return RawType[str];
    }.vldResult("RawType");
    RawType.asCtor("RawType");
    RawType.loadType("Number",w.Number);
    RawType.loadType("Boolean",w.Boolean);
    RawType.loadType("String",w.String);
    RawType.loadType("Date",w.Date);
    RawType.loadType("Function",w.Function);
    RawType.loadType("Object",w.Object);
    RawType.loadType("Array",w.Array);
    RawType.loadType("Undefined",undefined);
    RawType.loadType("Null",null);
    var each = ff.each = function(iterable,func,filter){
        if(iterable){
            if("length" in iterable){
                for(var i = 0;i<iterable.length;i++){
                		if(iterable[i]){
	                    if(filter&&!filter.apply(iterable[i],[i,iterable[i]])){continue;}
	                    else{func.apply(iterable[i],[i,iterable[i]]);}
                    }
                }
            }else{
                for(var key in iterable){
                    if(filter&&!filter.apply({key:key,value:iterable[key]},[key,iterable[key]])){continue;}
                    else{func.apply({key:key,value:iterable[key]},[key,iterable[key]]);}
                }
            }
        }
    }.vldParam({1:"Function",2:"Function"});

    var cloneObject = function(obj,context){
        var target = {};
        if(context){
            context[obj.hashCode()] = target;
        }else{
            var hash = obj.hashCode();
            context = {hash:target};
        }
        for(var key in obj){
            var type = RawType(obj[key]);
            if(type===RawType.Array){
                var hash = obj[key].hashCode();
                if(context[hash]){
                    target[key] = context[hash];
                }else{
                    target[key] = cloneArray(obj[key],context);
                }
            }else if(type===RawType.Object){
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
    }.vldParam({0:"Object",1:"Object"});

    var cloneArray = function(arr,context){
        var target = [];
        if(context){
            context[arr.hashCode()] = target;
        }else{
            var hash = arr.hashCode();
            context = {hash:target};
        }
        for(var i = 0;i<arr.length;i++){
            var type = RawType(arr[i]);
            if(type===RawType.Array){
                var hash = arr[i].hashCode();
                if(context[hash]){
                    target[i] = context[hash];
                }else{
                    target[i] = cloneArray(arr[i],context);
                }
            }else if(type===RawType.Object){
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
    }.vldParam({0:"Array",1:"Object"});

    var clone = ff.clone = function(obj){
        var type = RawType(obj);
        if(type===RawType.Array){
            return cloneArray(obj);
        }else if(type===RawType.Object){
            return cloneObject(obj);
        }else{
            return obj;
        }
    };

    var extend = ff.extend = function(){
        var target = {};
        for(var i = arguments.length;i--;){
            for(var name in arguments[i]){
                if(!arguments[i].hasOwnProperty(name)){continue;}
                var type = RawType(arguments[i][name]);
                if(type === RawType.Object){
                    if(name in target){
                        target[name] = extend(arguments[i][name],target[name]);
                    }else{
                        target[name] = cloneObject(arguments[i][name]);
                    }
                }else if(type === RawType.Array){
                    if(name in target){
                        continue;
                    }else{
                        target[name] = 	cloneArray(arguments[i][name]);
                    }
                }else{
                    if(name in target){continue;}
                    target[name] = 	arguments[i][name];
                }
            }
        }
        return target;
    };

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
        var t = RawType(obj);
        if(t!==type){
            if(!strict&&(t===RawType.Undefined||t===RawType.Null))return;
            throw e||"expected: "+type+" unexpected: "+t;
        }
    };
    var assertNumber = ff.assertNumber = function(obj,e){
        assertType(obj,RawType.Number,false,e);
    };
    var assertBoolean = ff.assertBoolean = function(obj,e){
        assertType(obj,RawType.Boolean,false,e);
    };
    var assertString = ff.assertString = function(obj,e){
        assertType(obj,RawType.String,false,e);
    };
    var assertDate = ff.assertDate = function(obj,e){
        assertType(obj,RawType.Date,false,e);
    };
    var assertFunction = ff.assertFunction = function(obj,e){
        assertType(obj,RawType.Function,false,e);
    };
    var assertObject = ff.assertObject = function(obj,e){
        assertType(obj,RawType.Object,false,e);
    };
    var assertArray = ff.assertArray = function(obj,e){
        assertType(obj,RawType.Array,false,e);
    };
})(window,document);