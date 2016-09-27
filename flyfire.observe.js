;(function(w,d,ff,o){
	var OI8Select = ff.OI8Select;
  var each = ff.each;
  var fieldAccessor = function(instance,accessors,name,value){
  	if(arguments.length===4){
  			return accessors[name].set.call(instance,value);
  	}else{
  			accessors[name].get.call(instance);	
  	}
  };
  var methodAccessor = function(instance,accessors,name){
  	return accessors[name].apply(instance,arguments.slice(3));	
  }
  var	defineProperties = OI8Select((function(def){
  	var JsObjectProxy = function(instance,accessors,fieldAccessor,methodAccessor){
  		this.inst = instance;
  		this.accs = accessors;
  		this.facc = fieldAccessor;
  		this.macc = methodAccessor;
  	};
  	return function(instance,accessors){
  			var jopxy = new JsObjectProxy(instance,accessors,fieldAccessor,methodAccessor);
  			def(jopxy,accessors);
  	};
  	
  })(o.defineProperties),(function(){
  	return function(instance,accessors){
  			
  	};
  })()).vldParam({0:"Object"});
	var observe = ff.observe = function(){};
})(window,document,flyfire,Object);