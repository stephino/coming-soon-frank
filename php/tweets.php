<?php
/**
 * @package       Stephino.com
 * @link          http://stephino.com
 * @copyright     Copyright 2013, Valentino-Jivko Radosavlevici
 * @license       GPL v3.0 (http://www.gnu.org/licenses/gpl-3.0.txt)
 * 
 * Redistributions of files must retain the above copyright notice.
 */
    /**
	 * Tweets Library
	 */
    class Tweets {
        // Twitter keys (You'll need to visit https://apps.twitter.com/app/new and register to get these.
        const CONSUMERKEY       = 'Gz0NBsJZeSZ5Z977CaERJHxrH';
        const CONSUMERSECRET    = 'B9LdbOYleo9S71Ydol3ULpgWZvpeKnJ7wCYgA3FP87zQwb57vR';
        const ACCESSTOKEN       = '765170530962010112-KT7eBoi2mQjPJqBkwupyqdFe9jfP8dK';
        const ACCESSTOKENSECRET = 'zoB1aZH6lFH0QUhuQc1zkrS155vjsckBWnTsjL1Vy7y1w';
        
        // Twitter options
        const OPT_USERNAME       = 'envato'; // (string)  Twitter username
        const OPT_COUNT          = 8;        // (int)     Number of tweets
        const OPT_INCLUDE_RTS    = true;     // (boolean) Include retweets
        const OPT_IGNORE_REPLIES = false;    // (boolean) Include replies
        
        // Cache time (in seconds)
        const CACHE_TIME        = 0;
        
        /**
         * Class constructor
         * 
         * @return Tweets
         */
        public function __construct() {
            // Set timezone.
            date_default_timezone_set('Europe/London');

            // Require TwitterOAuth files
            require_once dirname(__FILE__) . DIRECTORY_SEPARATOR . 'twitteroauth' . DIRECTORY_SEPARATOR . 'twitteroauth.php';
            
            // Content type
            header('content-type:text/plain;charset=utf-8');
        }
        
        /**
         * Echo the latest tweets in JSON format
         * 
         * @param string  $twitterUsername   Twitter username
         * @param string  $cacheFile         Change this to the path of your cache file
         * @param int     $noOfTweets        Number of tweets you would like to display
         * @param boolean $ignoreReplies     Ignore replies from the timeline
         * @param boolean $includeRts        Include retweets
         * @param string  $dateFormat        Date formatting (http://php.net/manual/en/function.date.php)
         * @param boolean $twitterStyleDates Twitter style days. [about an hour ago]
         */
        public function run($twitterUsername = 'envato', $cacheFile = 'tweets.txt', $noOfTweets = 5, $ignoreReplies = false, $includeRts = true, $dateFormat = 'g:i A M jS', $twitterStyleDates = true) {
            // GET values set
            if (null !== self::OPT_USERNAME) {
                $twitterUsername = self::OPT_USERNAME;
            }
            if (null !== self::OPT_COUNT) {
                $noOfTweets = self::OPT_COUNT;
            }
            if (null !== self::OPT_INCLUDE_RTS) {
                $includeRts = self::OPT_INCLUDE_RTS;
            }
            if (null !== self::OPT_IGNORE_REPLIES) {
                $ignoreReplies = self::OPT_IGNORE_REPLIES;
            }
            
            // Time that the cache was last updtaed.
            $cacheFileCreated  = file_exists(dirname(__FILE__) . DIRECTORY_SEPARATOR . $cacheFile) ? filemtime($cacheFile) : 0;

            // Get the tweets JSON
            $tweetsJson = '[]';
            
            // Show cached version of tweets, if it's less than self::CACHE_TIME.
            if (self::CACHE_TIME && time() - self::CACHE_TIME < $cacheFileCreated) {
                // Display tweets from the cache.
                $tweetsJson = file_get_contents(dirname(__FILE__) . DIRECTORY_SEPARATOR . $cacheFile);
            } else {
                // Cache file not found, or old. Authenticate app.
                $connection = new TwitterOAuth(self::CONSUMERKEY, self::CONSUMERSECRET, self::ACCESSTOKEN, self::ACCESSTOKENSECRET);
                
                // Get the latest tweets from Twitter
                $query = http_build_query(array(
                    'screen_name'     => $twitterUsername,
                    'count'           => $noOfTweets,
                    'include_rts'     => $includeRts,
                    'exclude_replies' => $ignoreReplies,
                ));
                $getTweets = $connection->get('https://api.twitter.com/1.1/statuses/user_timeline.json?' . $query);

                // Error check: Make sure there is at least one item.
                if (count($getTweets) && (!isset($getTweets['errors']) || !count($getTweets['errors']))) {
                    // Define tweet_count as zero
                    $tweetCount = 0;

                    // Get the tweets
                    $tweetsArray = array();

                    // Iterate over tweets.
                    foreach($getTweets as $tweet) {
                        // Get the twitter description
                        $tweetDesc = html_entity_decode($tweet['text']);

                        // Add hyperlink html tags to any urls, twitter ids or hashtags in the tweet.
                        $tweetDesc = preg_replace("/https?:\/\/[^<>\s]+/i", '<a rel="nofollow" href="$0" target="_blank">$0</a>', $tweetDesc);
                        $tweetDesc = preg_replace("/@([a-z0-9_]+)/i", '<a rel="nofollow" href="http://twitter.com/$1" target="_blank">$0</a>', $tweetDesc);
                        $tweetDesc = preg_replace("/#([a-z0-9_\-]+)/i", '<a rel="nofollow" href="http://twitter.com/search?q=%23$1" target="_blank">$0</a>', $tweetDesc);

                        // Convert Tweet display time to a UNIX timestamp. Twitter timestamps are in UTC/GMT time.
                        $tweetTime = strtotime($tweet['created_at']);	
                        if ($twitterStyleDates){
                            // Get the time diff
                            $timeDiff = abs(time() - $tweetTime);
                            switch ($timeDiff) {
                                case ($timeDiff < 60):
                                    $displayTime = $timeDiff . ' second' . ($timeDiff == 1 ? '' : 's') . ' ago';                  
                                    break;      
                                case ($timeDiff >= 60 && $timeDiff < 3600):
                                    $min = floor($timeDiff/60);
                                    $displayTime = $min . ' minute' . ($min == 1 ? '' : 's') . ' ago';                  
                                    break;      
                                case ($timeDiff >= 3600 && $timeDiff < 86400):
                                    $hour = floor($timeDiff/3600);
                                    $displayTime = 'about ' . $hour . ' hour' . ($hour == 1 ? '' : 's') . ' ago';
                                    break;          
                                default:
                                    $displayTime = date($dateFormat, $tweetTime);
                                    break;
                            }
                        } else {
                            $displayTime = date($dateFormat, $tweetTime);
                        }

                        // Render the tweet.
                        if ($tweetDesc) {
                            $tweetsArray[] = array(
                                'desc' => $tweetDesc,
                                'time' => $displayTime
                            );
                        }

                        // If we have processed enough tweets, stop.
                        if (++$tweetCount >= $noOfTweets){
                            break;
                        }
                    }

                    // Close the twitter wrapping element.
                    $tweetsJson = json_encode($tweetsArray);
                }
                
                // Save to file
                file_put_contents(dirname(__FILE__) . DIRECTORY_SEPARATOR . $cacheFile, $tweetsJson);
            }
            
            // Echo the tweets
            echo $tweetsJson;
        }
    }
 
// Run the tweets class
$twitterClient = new Tweets();
$twitterClient->run();