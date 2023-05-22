<?php
/**
 * @package       Stephino.com
 * @link          http://stephino.com
 * @copyright     Copyright 2013, Valentino-Jivko Radosavlevici
 * @license       GPL v3.0 (http://www.gnu.org/licenses/gpl-3.0.txt)
 * 
 * Redistributions of files must retain the above copyright notice.
 */
	// Get the reCaptcha library
    require_once dirname(__FILE__) . DIRECTORY_SEPARATOR . 'reCaptcha.php';
    
	/**
     * Contact class
     */
    class Contact {
        
        // Save types - Do not change!
        const SAVE_EMAIL    = 'save_email';
        const SAVE_DATABASE = 'save_database';
        const SAVE_TEXTFILE = 'save_textfile';
        
        /**
         * CHANGE: Set the save type by choosing one of the above constants
         * 
         * self::SAVE_EMAIL - Save the message by e-mail
         * self::SAVE_DATABASE - Save the message in a database table
         * self::SAVE_TEXTFILE - Save the message in a text file on the server
         * 
         * @var string
         */
        protected $_saveType = self::SAVE_TEXTFILE;
        
        /**
         * CHANGE: Save configuration
         * Provide the values for the appropiate Save Type (selected above)
         * 
         * @var array
         */
        protected $_saveConfiguration = array(
            // Database configuration
            self::SAVE_DATABASE => array(
                'db_server'   => 'localhost', // Set the appropiate MySQL server name
                'db_name'     => 'contacts', // Set the appropiate MySQL database name - you must create it first
                'db_username' => 'root', // Set the appropiate MySQL username that has access to the provided database
                'db_password' => '', // Set the user's password; leave empty if not applicable
                'table_name'  => 'contacts', // Set the table to store the message in; it must have the following columns: ID, NAME, EMAIL, CONTENT
            ),
            /**
             * Example table structure:
               CREATE TABLE `contacts`.`contacts` (
               `ID` INT( 11 ) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY ,
               `NAME` VARCHAR( 200 ) NULL ,
               `EMAIL` VARCHAR( 200 ) NULL ,
               `CONTENT` TEXT NULL
               ) ENGINE = MYISAM ;
             */
            
            // Email configuration
            self::SAVE_EMAIL => array(
                'to' => 'contact@example.com', // Correspondent's e-mail address
            ),
            
            // Text file configuration
            self::SAVE_TEXTFILE => array(
                'filename' => 'contacts.txt', // The name of the file to store the messages in
            )
        );
        
        /*********************************************************************************
         * Do not edit below this line unless you know what you are doing.
         * 
         * Thank you.
         * *******************************************************************************/        
        
        /**
         * Hold the newsletter instance
         * @var Contact
         */
        private static $_instance;
        
        // Message types
        const MESSAGE_TRY_AGAIN       = 'message_try_again';
        const MESSAGE_INVALID_FORM    = 'message_invalid_form';
        const MESSAGE_INVALID_NAME    = 'message_invalid_name';
        const MESSAGE_INVALID_CONTENT = 'message_invalid_content';
        const MESSAGE_INVALID_EMAIL   = 'message_invalid_email';
        const MESSAGE_COULD_NOT_SAVE  = 'message_could_not_save';
        const MESSAGE_SUCCESS         = 'message_success';
        const MESSAGE_INVALID_OPTIONS = 'message_invalid_options';
        
        // Save the available messages
        protected $_messages = array(
            self::MESSAGE_TRY_AGAIN       => 'Please refresh and try again.',
            self::MESSAGE_INVALID_FORM    => 'Invalid form submitted.',
            self::MESSAGE_INVALID_NAME    => 'Invalid or empty name submitted.',
            self::MESSAGE_INVALID_CONTENT => 'Invalid or empty content submitted.',
            self::MESSAGE_INVALID_EMAIL   => 'Invalid e-mail submitted.',
            self::MESSAGE_COULD_NOT_SAVE  => 'Could not save your message.',
            self::MESSAGE_SUCCESS         => 'Thank you, %s! We will get back to you as soon as possible.',
            self::MESSAGE_INVALID_OPTIONS => 'We are experiencing technical difficulties. Please come back later!',
        );
        
        /**
         * Output messages
         * 
         * @var array
         */
        protected $_output = array();
        
        /**
         * Singleton
         */
        private function __construct(){}
        
        /**
         * Get an instance
         * 
         * @return Contact
         */
        public static function getInstance() {
            if (!isset(self::$_instance)) {
                self::$_instance = new self();
            }
            return self::$_instance;
        }
        
        /**
         * Script initialization
         * 
         * @return void
         */
        protected function _init() {
            // JSON response
            header('content-type:application/json');
            
            // Start the Output Buffer
            ob_start();
            
            // No error reporting
            error_reporting(0);
            
            // No time limit
            set_time_limit(0);
            
            // Set the flush
            register_shutdown_function(array($this, 'flush'));
        }
        
        /**
         * Flush the output
         */
        public function flush() {
            // No direct echos allowed
            ob_end_clean();

            // Display the messages
            echo json_encode($this->_output);
            
            // Stop here
            exit();
        }
        
        /**
         * Add a response message
         * 
         * @param string         $message Message
         * @param boolean|string $status  Message status
         */
        protected function _setMessage($message, $status = true) {
            $this->_output[] = array(
                'message' => $message,
                'status'  => $status
            );
        }
        
        /**
         * Run the newsletter
         */
        public function run() {
            // Initialize the script
            $this->_init();
            
            do {
                // Get the reCaptcha object
                $reCaptcha = new Captcha();
                if (null !== $reCaptchaResult = $reCaptcha->init()) {
                    // Invalid captha solution
                    if (!$reCaptchaResult->is_valid) {
                        // Set the error message
                        $this->_setMessage($reCaptcha->error($reCaptchaResult->error), false);
                        break;
                    }
                } else {
                    // Please type the two words
                    $this->_setMessage('Please type the two words', false);
                    break;
                }
                
                // We need the name field
                if (!$this->_hasPosted('name')) {
                    $this->_setMessage($this->_messages[self::MESSAGE_INVALID_NAME], false);
                    $this->_setMessage($this->_messages[self::MESSAGE_TRY_AGAIN], 'info');
                    break;
                }
                
                // Get the e-mail field
                $name = $_POST['name'];
                
                // We need the e-mail field
                if (!$this->_hasPosted('email')) {
                    $this->_setMessage($this->_messages[self::MESSAGE_INVALID_FORM], false);
                    $this->_setMessage($this->_messages[self::MESSAGE_TRY_AGAIN], 'info');
                    break;
                }
                
                // Get the e-mail field
                $email = $_POST['email'];
                
                // We need the content field
                if (!$this->_hasPosted('content')) {
                    $this->_setMessage($this->_messages[self::MESSAGE_INVALID_CONTENT], false);
                    $this->_setMessage($this->_messages[self::MESSAGE_TRY_AGAIN], 'info');
                    break;
                }
                
                // Get the content field
                $content = $_POST['content'];
                
                // Validate the e-mail
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $this->_setMessage($this->_messages[self::MESSAGE_INVALID_EMAIL], false);
                    $this->_setMessage($this->_messages[self::MESSAGE_TRY_AGAIN], 'info');
                    break;
                }
                
                // Try to save the e-mail
                if (@!$this->_saveMessage($name, $email, $content)) {
                    $this->_setMessage($this->_messages[self::MESSAGE_COULD_NOT_SAVE], false);
                    $this->_setMessage($this->_messages[self::MESSAGE_TRY_AGAIN], 'info');
                    break;
                }
                
                // Default thank you message
                $this->_setMessage(sprintf(
                    $this->_messages[self::MESSAGE_SUCCESS],
                    $name
                ));
                
            } while (false);
        }
        
        /**
         * Save the message
         * 
         * @param string $name    Name
         * @param string $email   E-mail address
         * @param string $content Content
         * @return boolean
         */
        protected function _saveMessage($name, $email, $content) {
            return true;
            
            // Ucword on the name
            $name = ucwords(strtolower($name));
            
            // Strtolower on the e-mail
            $email = strtolower($email);
            
            switch ($this->_saveType) {
                case self::SAVE_TEXTFILE:
                    return $this->_saveMessageTextFile($name, $email, $content);
                    break;
                case self::SAVE_DATABASE:
                    return $this->_saveMessageDb($name, $email, $content);
                    break;
                case self::SAVE_EMAIL:
                default:
                    return $this->_saveMessageEmail($name, $email, $content);
                    break;
            }
        }
        
        /**
         * Save the message in a text file
         * 
         * @param string $name    Name
         * @param string $email   E-mail
         * @param string $content Content
         */
        protected function _saveMessageTextFile($name, $email, $content) {
            // Verify the options were set
            if ('' == $filename = $this->_saveConfiguration[$this->_saveType]['filename']) {
                $this->_setMessage($this->_messages[self::MESSAGE_INVALID_OPTIONS], false);
                return false;
            }
            
            // Get the full path
            $path = dirname(dirname(__FILE__)) . DIRECTORY_SEPARATOR . basename($filename);
            
            // Format the message
            $message = sprintf(
                str_repeat('-', 50)
                . PHP_EOL
                . 'Name: %s, e-mail: %s' 
                . PHP_EOL . '%s' 
                . PHP_EOL
                . str_repeat('-', 50),
                $name, $email, $content
            );
            
            // Append the message
            return file_put_contents($path, file_get_contents($path) . PHP_EOL . $message);
        }
        
        /**
         * Send the message by e-mail
         * 
         * @param string $name    Name
         * @param string $email   E-mail
         * @param string $content Content
         */
        protected function _saveMessageDb($name, $email, $content) {
            // Verify the options were set
            foreach (array('db_server', 'db_name', 'db_username', 'table_name') as $key) {
                if ('' == ${$key} = $this->_saveConfiguration[$this->_saveType][$key]) {
                    $this->_setMessage($this->_messages[self::MESSAGE_INVALID_OPTIONS], false);
                    return false;
                }
            }
            
            // Set the database password
            $db_password = $this->_saveConfiguration[$this->_saveType]['db_password'];
            
            // Try to connect to the server
            if (false === mysql_connect($db_server, $db_username, $db_password)) {
                $this->_setMessage($this->_messages[self::MESSAGE_INVALID_OPTIONS], false);
                return false;
            }
            
            // Select the database
            if (false === mysql_select_db($db_name)) {
                $this->_setMessage($this->_messages[self::MESSAGE_INVALID_OPTIONS], false);
                return false;
            }
            
            // Prepare the SQL query
            $sql = sprintf(
                'INSERT INTO `%s`
                 SET `NAME` = \'%s\',
                    `EMAIL` = \'%s\',
                    `CONTENT` = \'%s\'',
                $table_name,
                mysql_real_escape_string($name),
                mysql_real_escape_string($email),
                mysql_real_escape_string($content)
            );
            
            // Execute it
            return (false !== mysql_query($sql));
        }
        
        /**
         * Send the message by e-mail
         * 
         * @param string $name    Name
         * @param string $email   E-mail
         * @param string $content Content
         */
        protected function _saveMessageEmail($name, $email, $content) {
            // Verify the options were set
            if ('' == $to = $this->_saveConfiguration[$this->_saveType]['to']) {
                $this->_setMessage($this->_messages[self::MESSAGE_INVALID_OPTIONS], false);
                return false;
            }
            
            // Format the message
            $message = sprintf(
                str_repeat('-', 50)
                . PHP_EOL
                . 'Name: %s, e-mail: %s' 
                . PHP_EOL . '%s' 
                . PHP_EOL
                . str_repeat('-', 50),
                $name, $email, $content
            );
            
            // Send the e-mail
            return @mail($to, 'Client contact', $message);
        }
        
        /**
         * Check if the user has posted
         * 
         * @param string $fieldName FieldName
         * @return boolean
         */
        protected function _hasPosted($fieldName=null) {
            if (null === $fieldName) {
                return isset($_POST) && !empty($_POST);
            }
            
            return isset($_POST) && isset($_POST[$fieldName]);
        }
        
    }
    
// Run the app
Contact::getInstance()->run();