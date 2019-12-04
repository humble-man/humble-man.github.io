/**
 * 人物的定义
 */
var Person = function(x,y,img,cxt,panelInfo) {
	/*人物出场坐标*/
	this.x = x;
	this.y = y;
	/*图片对象*/
	this.img = img;
	this.cxt = cxt;
	this.pinfo = panelInfo;//游戏窗口面板
	
	this.xspeed = 7;//x轴加速度
	this.yspeed = 5;//y轴加速度

	this.yaspeed = 0.2;//y轴 加速度 增量

	this.life = 10;//血量

	this.lifeAdd = 0.5;//血量增加幅度
	
	this.dir = "down";//方向

	this.lastKey = "";//最后按键
	
	this.sprite = null;//精灵

	this.isJump = true;//是否跳起

	this.isFilp = false;//是否在弹簧障碍物 上 弹起

	this.block = null;//障碍物

	this.isDead = false;//是否死亡
	
	this.init();//初始化
}

Person.prototype = {
    //人物初始化
    init : function(){
        /*调用人物初始化方法*/
        this.initSprite();
        /*动作精灵Y轴加速，使人物往下掉*/
        this.sprite.setYSpeed(this.yspeed,this.yaspeed);
    },
    //初始化方法
    initSprite : function(){
        /*创建精灵对象*/
        var sprite = new Common.sprite.Sprite(this.img,this.cxt,10,{x:this.x,y:this.y});


        // 裁剪对应动作图片
        var ratio = window.innerWidth / 375;
        var down = new Common.sprite.Animation({startX:64,sw:64,sh:64,width:50 * ratio,height:50 * ratio}); //往下掉的动作
        var normal = new Common.sprite.Animation({sw:64,sh:64,width:50 * ratio,height:50 * ratio}); //正常的动作
        var up = new Common.sprite.Animation({startX:128,sw:64,sh:64,width:50 * ratio,height:50 * ratio}); //往上跳的动作
        var right = new Common.sprite.Animation({startX:320,fs:2,sw:64,sh:64,width:50 * ratio,height:50 * ratio,loop:true}); //往右跑的动作
        var left = new Common.sprite.Animation({startX:192,fs:2,sw:64,sh:64,width:50 * ratio,height:50 * ratio,loop:true}); //往左跑的动作
        
        /*添加对应按键的动作图片*/
        sprite.add("down",down);
        sprite.add("normal",normal);
        sprite.add("up",up);
        sprite.add("right",right);
        sprite.add("left",left);
        
        this.sprite = sprite;
    },
    // 人物改变方向事件
    changeDir : function(dir,flag){
        this.lastKey = dir;
        /*如果人物以死亡直接返回*/
        if(this.isDead)return false;

        /*操作方向与当前方向一致直接返回，只有横方向*/
        if(dir == this.dir && (dir=="left" || dir=="right"))return false;

        if(this.isJump == false || dir == "down" || dir == "up"){
            this.dir = dir;
            this.sprite.change(this.dir);
        }
        var xforce = this.block?this.block.xforce||0:0;//x轴 障碍物 推动力
        //根据方向 设置x轴 加速度
        if(dir == "left")this.sprite.setXSpeed(this.xspeed*-1 + xforce);
        else if(dir == "right")this.sprite.setXSpeed(this.xspeed + xforce);
        else if(dir == "normal" && !flag) this.sprite.setXSpeed(xforce);
    },
    // 在画板上绘画出我当前的动作图片事件
    draw : function(){
        this.sprite.draw();
    },
    //更新当前人物的动作图片事件
    update : function(){
        //改变加速度
        this.sprite.update();
        //更新血量
        this.life += this.lifeAdd;
        if(this.life >= 100)this.life = 100;
        if(this.life<30){document.querySelector("#personLife").style.backgroundColor="red";}
        else 
        if(this.life>=30&&this.life<60){document.querySelector("#personLife").style.backgroundColor="yellow";}
        else{document.querySelector("#personLife").style.backgroundColor="greenyellow";}

        //判断边界值(小人 x轴位置)
        var f_size = this.size();
        var x = f_size.x;
        var y = f_size.y;

        //小人 超出左边界
        var ratio = window.innerWidth / 375;
        if(x <= 0){   
            x = 0;
        }
        
        //小人 超出右边界
        if(f_size.r >= this.pinfo.w){
            x = this.pinfo.w - f_size.w;
        }
        //小人 超出下边界 同时处于跳跃状态
        if(f_size.b >= this.pinfo.h && this.isJump==true){
            //小人 y轴位置
            y = this.pinfo.h - f_size.h;
            //死亡
            this.dead();
        }
        //小人 超出上边界
        if(f_size.y <= 0)this.dead();

        //判断是否离开方块
		if(this.block){
		    var b_size = this.block.size();
		    //离开障碍物
			if(f_size.r <= b_size.x || f_size.x >= b_size.r){
				this.goDown();
	    	}
		}
			
		//离开弹簧障碍物 同时 y轴加速度>0
		if(this.isFilp && this.sprite.yspeed >= 0){

		    this.goDown();
		}

        //小人移动
        this.move(x,y);
    },
    //获取当前人物图片的大小事件
    size : function(){
        return this.sprite.size();
    },
    // 人物移动事件
    move : function(x,y){
        this.sprite.move(x,y);
    },
    //正在向下
    goDown : function(){
        //方向正常、x轴加速度为0
        if(this.dir == "normal")this.sprite.setXSpeed(0);
        //y轴加速度 随着y轴增量 -> 增加
        this.sprite.setYSpeed(this.yspeed,this.yaspeed);
        this.changeDir("down");
        this.isJump = true;
        this.isFilp = false;
        this.block = null;//无障碍物
    },
    //正在向上
    goUp : function(){
        this.changeDir("up");
        this.isJump = true;//处于跳跃
        this.isFilp = true;//在弹簧障碍物上 跳起
        this.block = null;//无障碍物
        //y轴加速度, y轴加速度增量
        this.sprite.setYSpeed(this.yspeed*-2,0.4);
    },
    //检查是否在障碍物上
    checkBlockOn : function(block){
        if(!this.isJump)return false;
        var m_size = this.size();
        var b_size = block.sprite.size();
        if(m_size.r > b_size.x && m_size.x < b_size.r){
            if(m_size.b >= b_size.y && m_size.b <= b_size.b +4){
                /*y坐标等于障碍物Y坐标减去人物高度*/
                this.standBlock(m_size.x,b_size.y-m_size.h);
                this.block = block;
                /*调用当前障碍物对人物的作用*/
                block.ManOn(this);
                return true;
            }
        }
        return false;
    },
    //位于障碍物上
    standBlock : function(x,y){
        this.move(x,y);
        this.isJump = false;
        if(this.lastKey == "left" || this.lastKey == "right"){
            this.changeDir(this.lastKey);
        }else{
            this.changeDir("normal",true);
        }
    },
    //改变加速度，当接触障碍物时
	changeSpeed : function(xspeed,yspeed){
		if(xspeed)this.sprite.setXSpeed(xspeed);
		if(yspeed)this.sprite.setYSpeed(yspeed);
    },
    setXForce : function(xforce){//设置x轴 推动力
        if(this.dir == "left"){
            this.sprite.setXSpeed(this.xspeed * -1 + xforce);
        }
        else if(this.dir == "right"){
            this.sprite.setXSpeed(this.xspeed + xforce);
        }
        else if(this.dir == "normal"){
            this.sprite.setXSpeed(xforce);
        }
    },
    cutLift : function(cut){//缩减生命值
        this.life -= cut;
        if(this.life <= 0)this.dead();
    },
    // 人物死亡事件
    dead:function(){
        // x,y轴的速度都为0--人物不动
        this.sprite.setXSpeed(0);
        this.sprite.setYSpeed(0);
        // 人物动作状态改为正常状态
        this.changeDir("normal");
        // 人物死亡状态为死亡
		this.isDead = true;
    }
}