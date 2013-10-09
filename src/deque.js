var Deque = (function() {
CONSTANT(DEQUE_MAX_CAPACITY, (1 << 30) | 0);
CONSTANT(DEQUE_MIN_CAPACITY, 16);

function arrayCopy( src, srcIndex, dst, dstIndex, len ) {
    for( var j = 0; j < len; ++j ) {
        dst[ j + dstIndex ] = src[ j + srcIndex ];
    }
}

function pow2AtLeast( n ) {
    n = n >>> 0;
    n = n - 1;
    n = n | (n >> 1);
    n = n | (n >> 2);
    n = n | (n >> 4);
    n = n | (n >> 8);
    n = n | (n >> 16);
    return n + 1;
}

function getCapacity( capacity ) {
    if( typeof capacity !== "number" ) return DEQUE_MIN_CAPACITY;
    return pow2AtLeast(
        Math.min(
            Math.max( DEQUE_MIN_CAPACITY, capacity ), DEQUE_MAX_CAPACITY )
    );
}

function Deque( capacity ) {
    this._capacity = getCapacity( capacity );
    this._length = 0;
    this._front = 0;
    this._makeCapacity();
}
var method = Deque.prototype;

method._willBeOverCapacity = function( size ) {
    return this._capacity < size;
};

method._pushOne = function( arg ) {
    var length = this.length();
    this._checkCapacity( length + 1 );
    var i = ( this._front + length ) & ( this._capacity - 1 );
    this[i] = arg;
    this._length = length + 1;
};

method.push = function( fn, receiver, arg ) {
    ASSERT( arguments.length === 3 );
    ASSERT( typeof fn === "function" );
    var length = this.length() + 3;
    if( this._willBeOverCapacity( length ) ) {
        //The fast array copies expect the
        //underlying array to be filled completely
        this._pushOne( fn );
        this._pushOne( receiver );
        this._pushOne( arg );
        return;
    }
    var j = this._front + length - 3;
    this._checkCapacity( length );
    var wrapMask = this._capacity - 1;
    this[ ( j + 0 ) & wrapMask ] = fn;
    this[ ( j + 1 ) & wrapMask ] = receiver;
    this[ ( j + 2 ) & wrapMask ] = arg;
    this._length = length;
};

method.shift = function() {
    ASSERT( this.length() > 0 );
    var front = this._front,
        ret = this[ front ];

    this[ front ] = void 0;
    this._front = ( front + 1 ) & ( this._capacity - 1 );
    this._length--;
    return ret;
};


method.length = function() {
    return this._length;
};

method._makeCapacity = function() {
    var len = this._capacity;
    for( var i = 0; i < len; ++i ) {
        this[i] = void 0;
    }
};

method._checkCapacity = function( size ) {
    if( this._capacity < size ) {
        this._resizeTo( this._capacity << 3 );
    }
};

method._resizeTo = function( capacity ) {
    var oldFront = this._front;
    var oldCapacity = this._capacity;
    var oldQueue = new Array( oldCapacity );
    var length = this.length();

    arrayCopy( this, 0, oldQueue, 0, oldCapacity );
    this._capacity = capacity;
    this._makeCapacity();
    this._front = 0;
    //Can perform direct linear copy
    if( oldFront + length <= oldCapacity ) {
        arrayCopy( oldQueue, oldFront, this, 0, length );
    }
    else {//Cannot perform copy directly, perform as much as possible
            //at the end, and then copy the rest to the beginning of the buffer
        var lengthBeforeWrapping =
            length - ( ( oldFront + length ) & ( oldCapacity - 1 ) );

        arrayCopy( oldQueue, oldFront, this, 0, lengthBeforeWrapping );
        arrayCopy( oldQueue, 0, this, lengthBeforeWrapping,
                    length - lengthBeforeWrapping );
    }
};

return Deque;})();