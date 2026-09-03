// Feed Services

module.exports = {
	...require("./discover-feed.service"),
	...require("./explore-feed.service"),
	...require("./foryou-feed.service"),
	...require("./library-feed.service"),
	...require("./profile-feed.service"),
	...require("./following-feed.service"),
};
