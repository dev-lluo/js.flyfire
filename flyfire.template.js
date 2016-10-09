(function(w,d,ff){
	var RawType = ff.RawType;
	var extend = ff.extend;
	var each = ff.each;
	var query = ff.query;
	var convert = ff.convert;
	var mock = ff.mock;
	var observe = ff.observe;
	var Association = ff.Association;
	var TemplateCache = {};
	var tokenExp = /(\{{2}[a-zA-Z0-9_\.\[\]]{1,}\}{2})/g;
	var assnExp = (function(ass){
		ass.test = ass.test.after(function(jp){
			this.restore();
		});
		ass.exec = ass.exec.after(function(jp){
			this.restore();
		});
		return ass;
	})(/^\{{2}([a-zA-Z0-9_\.\[\]]{1,})\}{2}$/g);
	var Syntax = function(tokenStr){
		var tokens = tokenStr.split(tokenExp);
		var assnPnt = [];
		each(tokens,function(i){
			var ass = assnExp.exec(this)[1];
			tokens[i] = new Association(ass);
			assnPnt.push(i);
		},function(){return assnExp.test(this);});
		this.tokens = tokens;
		this.assnPnt = assnPnt;
	};
	Syntax.prototype.runner = function(){
		var buffer = [];
		each(this.tokens,function(){
			buffer.push(this);
		});
		return {
			owner:this,
			cursor:0,
			hasAssn:function(){
				return this.cursor<this.owner.assnPnt.length;
			},
			current:function(){
				var index = this.cursor++;
				return {
					owner:this,
					index:index,
					assn:this.buffer[this.owner.assnPnt[index]],
					exists:function(instance){
						return this.assn.exists(instance);
					},
					runAt:function(instance){
						this.owner.buffer[this.owner.owner.assnPnt[index]] = this.assn.valueOf(instance);
					},
					flush:function(value){
						this.owner.buffer[this.owner.owner.assnPnt[index]] = value;
					}
				};
			},
			buffer:buffer,
			result:function(){
				return this.buffer.join("");
			}
		};
	};
	var convert = function(tmps){
		var templates = [];
		each(tmps,function(){
			var tmp = this;
			if(this.nodeType===1){
				var def = query.getAttr(tmp,"def");
				query.removeAttr(tmp,"def");
				var listItem = query.getAttr(tmp,"list-item");
				query.removeAttr(tmp,"list-item");
				var list = query.getAttr(tmp,"list");
				query.removeAttr(tmp,"list");
				//检测本地变量定义
				var local = convert(def);
				if(RawType.Object.has(local)){
					each(local,function(){
						local[this.key] = new Association(this.value);
					},function(){
						return assnExp.test(query.getAttr(tmp,this.value));
					});
				}else{
					local = {};
				}
				//检测dom属性语法
				var attr = {};
				each(attrHook,function(){
					attr[this] = new Syntax(query.getAttr(tmp,this));
				},function(){
					tokenExp.restore();
					return tokenExp.test(query.getAttr(tmp,this));
				});
				//检测子节点
				var child = query.getChild(tmp,true);
				var childTemplates = convert(child);
				var type = "tag";
				if(assnExp.test(list)){
					type = "list";
					local.__list__  = new Association(list);
					local.__item__ = listItem||"item";
				}
				templates.push(new Template(tmp,attr,null,local,type,childTemplates));
			}else if(this.nodeType===3){
				var text = tmp.nodeValue;
				templates.push(new Template(tmp,null,new Syntax(text),{},"text",null));
			}
		});
		return templates;
	};
	var append = function(parent,childs){
		if(RawType.Array.has(childs)){
			each(childs,function(){
				query.append(parent,this);
			});
		}else{
			query.append(parent,childs);
		}
	}
	var attrHook = ["id","class","name","value","style","title","type","href","rel","src","readonly","checked"];
	var Template = function(dom,attr,text,local,type,templates){
		this.dom = dom;
		this.attr = attr;
		this.text = text;
		this.local = local;
		this.type = type;
		this.templates = templates;
	};
	Template.text = function(template,global,local){
		var clone = query.cloneNode(template.dom);
		var runner = template.text.runner();
		while(runner.hasAssn()){
			var current = runner.current();
			if(current.exists(local)){
				current.runAt(local);
			}else{
				current.runAt(global);
				observe(global,'set',function(e){
					current.flush(e.newValue);
					clone.nodeValue = runner.result();
				},current.assn);
			}
		}
		clone.nodeValue = runner.result();
		return clone;
	};
	Template.tag = function(template,global,local){
		var clone = query.cloneNode(template.dom);
		local = extend(local,(function(){
			var exd = {};
			each(template.local,function(){
				if(RawType.Association.has(this.value)){
					if(this.value.exists(local)){
						exd[this.key] = this.value.valueOf(local);
					}else{
						exd[this.key] = this.value.valueOf(global);
					}
				}else{
					exd[this.key] = this.value;
				}
			});
			return exd;
		})());
		each(template.attr,function(){
			var runner = this.value.runner();
			while(runner.hasAssn()){
				var current = runner.current();
				if(current.exists(local)){
					current.runAt(local);
				}else{
					current.runAt(global);
					observe(global,'set',function(e){
						current.flush(e.newValue);
					},current.assn);
				}
			}
		});
		each(template.templates,function(){
			append(clone,Template[this.type](this,global,local));
		});
		return clone;
	};
	Template.list = function(template,global,local){
		var clones = [];
		var list = template.local.__list__.valueOf(global);
		each(list,function(){
			var self = this;
			local = extend(local,(function(){
				var exd = {};
				exd[template.local.__item__] = self;
				return exd;
			})());
			clones.push(Template.tag(template,global,local));
		});
		return clones;
	};
	Template.root = function(template,global,local){
		var clones = [];
		each(template.templates,function(){
			var type = this.type;
			if(type==="list"){
				var clone = Template[type](this,global,local);
				Array.prototype.push.apply(clones,clone);
			}else{
				var clone = Template[type](this,global,local);
				Array.prototype.push.call(clones,clone);
			}
		});
		return clones;
	};
	Template.valueOf = function(htmlStr){
		var hash = htmlStr.hashCode();
		if(hash in TemplateCache){
			return TemplateCache[hash];
		}else{
			var tmps = query.parseHTML(htmlStr);
			var templates = convert(tmps);
			var template = new Template(null,null,null,null,"root",templates);
			TemplateCache[hash] = template;
			return template;
		}
	};
	var tmpl = ff.tmpl = function(config){
		var cfg = ff.extend({
				tmpl : "script[type='text/flyfire-view']",
				data : {},
				render : "body"
		},config);
		var tmpl = query(cfg.tmpl);
		var render = query(cfg.render);
		var data = mock(cfg.data);
		tmpl.each(function(){
			var htmlStr = query.getText(this);
			var tpl = Template.valueOf(htmlStr);
			var nodes = Template[tpl.type](tpl,data,{});
			render.each(function(){
				append(this,nodes);
			});
		});
		return data;
	};
})(window,document,flyfire);