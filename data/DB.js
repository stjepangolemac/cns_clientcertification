// We consider a simple hierarchical RBAC. In this direction we organise
// organise roles as a DAG (Directed Acyclic Graph). A 'parent' role
// role inherits permissions of all its 'descendant' roles.
var db = {  
			headers: ['Username', 'Full name', 'Salt', 'Password', 'Role', 'Bio', 'Active', 'Serial'],
            users: [{ // User to roles relationship ( pwd hash: crypto.pbkdf2(pwd,salt,200000,20,'sha256',function(err,key){console.log(key.toString('hex'))} )
					 username: 'mcagalj',
					 name: 'Mario Čagalj',
					 salt: 'salt0',
					 password: '34f2a861ce295e361b839f287dc51bc627871e4a', // pwd = mario
					 role: 'member',
					 bio: "Mario received the Ph.D. degree in Communication Systems from EPFL, Switzerland. In September 2006, Mario joined the University of Split, the Faculty of Electrical Engineering, Mechanical Engineering and Naval Architecture (FESB).",
					 active: false,
					 serial: '03'
			  	   },
				   {
					username: 'toperkov',
					name: 'Toni Perković',
					salt: 'salt1',
					password: '95bbbd03e80cb0084bb70421f14cc7d8b2b65ad5', // pwd = toni
					role: 'admin',
					bio: "Toni is employed as a senior researcher at Electrical Engineering studies at Faculty of Electrical Engineering, Mechanical Engineering and Naval Architecture (FESB), University of Split, where he is actively involved in courses in the fields of cryptography and network security, wireless security, wireless sensor networks and human-computer interaction.",
					active: false,
                    serial: '08'
			       },
				   {
					username: 'tonko',
					name: 'Tonko Kovačević',
					salt: 'salt2',
					password: 'b70d7ba5b522d692ef8d5491acb874fc08d99576', // pwd = tonko
					role: 'member',
					bio: "Magistar znanosti iz područja tehničkih znanosti, znanstvenog polja elektrotehnika. Sveučilišni studijski centar za stručne studije, Sveučilište u Splitu, Predstojnik Zavoda za elektroniku i viši predavač.",
					active: false,
                    serial: '07'
				   },
				   {
					username: 'john',
					name: 'John Doe',
					salt: 'salt3',
					password: '35f9749aac7500c229e86e05c264a85937ec9b94', // pwd = doe
					role: 'visitor',
					bio: 'Not much to tell about JD',
					active: false,
                    serial: '06'
				   }]  
          };

var get = function( list ) {
	return db[list];
}; 

// Example use: find('users', {username: 'toni'})
var find = function( list, item, callback ) {
	var index = -1;
	var _list = get(list);
	var property = Object.getOwnPropertyNames(item)[0];
	
	// Check if item in list
	_list.some(function(_item, _index) {
		if ( _item.hasOwnProperty(property) ) {		
			if ( _item[property] === item[property] ) {
				index = _index;
				property = null; // GC can clean
				return true;
			}
		}
	});
	
	// async
	if (typeof callback != 'undefined' && typeof callback === 'function') {
		(index > -1) ? callback(_list[index]) : callback(null, {});
		_list = null; // GC can clean
		index = null;
		return;
	}
	
	// sync (callback function not provided)
	if (index > -1)
		return _list[index];
	else 
		return {}; // To check if object is empty use: Object.keys({}).length;	
};

module.exports = {
		get: get,
		find: find
};