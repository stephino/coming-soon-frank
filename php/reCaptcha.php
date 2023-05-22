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
	 * Captcha Library
	 */
	class Captcha {
        
        /**
         * ReCaptcha Private Key
         * 
         * @var string
         */
		public $private_key = '6Ldc198SAAAAAFHXOklc5h_UebKmbWzLK8soAbuG';
        
        /**
         * ReCaptcha Public Key
         * 
         * @var string
         */
		public $public_key = '6Ldc198SAAAAANX8tUzQveaLWorHjlX56B2fKcKF';
        
        /*********************************************************************************
         * Do not edit below this line unless you know what you are doing.
         * 
         * Thank you.
         * *******************************************************************************/   
        
        /**
         * ReCaptcha API Server
         */
		const RECAPTCHA_API_SERVER        = 'http://www.google.com/recaptcha/api';
		const RECAPTCHA_API_SECURE_SERVER = 'https://www.google.com/recaptcha/api';

        /**
         * ReCaptcha verification server
         */
		const RECAPTCHA_VERIFY_SERVER = 'www.google.com';
        
        /**
         * Error key
         * 
         * @var string
         */
		protected $_error = null;
		
		/**
		 * Initialize the captcha; also verify the user input
		 * 
		 * @example 
		 * // Initialize the captcha and send the response to $this->method
		 * {captcha}->init(array($this,'method'));
		 * 
		 * @param array $function     (object,method_name) A method which is called after the user submits the form<br/>
		 * This method accepts 1 parameter, type stdClass with 2 properties:<ul>
		 * <li>$r->is_valid - boolean</li>
		 * <li>$r->error - the error message</li>
		 * </ul>
		 * @param string $public_key  Overwrites the public key settings
		 * @param string $private_key Overwrites the private key settings
		 * @return stdClass|null Null if the user has not posted a reCaptcha
		 * 
		 * @author Valentino-Jivko Radosavlevici
		 */
		function init($public_key=null, $private_key=null) {
			// Reset the keys?
			if (!is_null($public_key)) {
                $this->public_key = $public_key;
            }
			if (!is_null($private_key)) {
                $this->private_key = $private_key;
            }
			
            // Prepare the result
            $r = null;
            
			// Any post?
			if ($this->_post('recaptcha_challenge_field') && $this->_post('recaptcha_response_field')) {
				// Get the response
                $r = $this->_check_answer(
                    $this->_post('recaptcha_challenge_field'),
                    $this->_post('recaptcha_response_field')
                );
                
                // Save the error
                if (!$r->is_valid) {
                    $this->_error = $r->error;
                }
			}
			
			// Done
			return $r;   
		}
        
		/**
		 * Gets the challenge HTML (javascript and non-javascript version).
		 * This is called from the browser, and the resulting reCAPTCHA HTML widget
		 * is embedded within the HTML form it was called from.
         * 
		 * @param boolean $use_ssl Should the request be made over ssl? (optional, default is false)
		 * @return string - The HTML to be embedded in the user's form.
		 */
		function html($theme='white', $use_ssl=null) {
            // Get the custom theme settings
            $custom = '';
			if (!is_null($theme) && in_array($theme, array('red', 'white', 'blackglass', 'clean', 'custom'))) {
				$custom = "<script type=\"text/javascript\">var RecaptchaOptions = {theme:'{$theme}'};</script>";
			}
            
            // Prepare the Server URI
            $server = self::RECAPTCHA_API_SERVER;
            if (empty($use_ssl) && !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) {
                $server = self::RECAPTCHA_API_SECURE_SERVER;
            }
			$uri = sprintf('%s/challenge?k=%s', $server, $this->public_key . (!is_null($this->_error)?("&amp;error=" . $this->_error) : ''));
            
			// Return the string
			return $custom  . '<script type="text/javascript" src="' . $uri . '"></script>';
		}
        
		/**
		 * Return an english translation of the error
		 * 
		 * @example 
		 * 
		 * @param string $errCode
		 * @return 
		 * @package Fervoare.com
		 * 
		 * @author Valentino-Jivko Radosavlevici
		 */
		public function error($errCode=NULL) {
			// Return nothing
			if (is_null($errCode)) {
                $errCode = $this->_error;
            }
			
			// Define the errors
			$errors	= array(
				'invalid-site-private-key'	=>	'We weren\'t able to verify the private key.',
				'invalid-request-cookie'	=>	'The challenge parameter of the verify script was incorrect.',
				'incorrect-captcha-sol'		=>	'The CAPTCHA solution was incorrect.',
				'recaptcha-not-reachable'	=>	'reCAPTCHA server could not be contacted.',
                'could-not-open-socket'     =>  'Could not open socket.',
                'incorrect-server-response' =>  'Incorrect server response.',
			);
			
			// Return the translation
			if (in_array($errCode, array_keys($errors))) {
				return $errors[$errCode];
			} else {
				return 'Unexpected error. Please refresh the page and try again.';
			}
		}
		
        /**
         * Return a POST key
         * 
         * @param string $key POST key
         * @return string|null
         */
        protected function _post($key) {
            return isset($_POST[$key]) ? $_POST[$key] : null;
        }
	
		/**
		 * Calls an HTTP POST function to verify if the user's guess was correct
		 * 
		 * @param string $challenge   Challenge
		 * @param string $response    Response
		 * @param array  $extraParams An array of extra variables to post to the server
		 * @return stdClass
		 */
		protected function _check_answer($challenge = '', $response = '', $extraParams = array()) {
            // Prepare the reCaptcha response
            $recaptchaResponse = new stdClass();
            
			// Discard spam submissions
			if ($challenge == null || strlen($challenge) == 0 || $response == null || strlen ($response) == 0) {
				$recaptchaResponse->is_valid = false;
				$recaptchaResponse->error = 'incorrect-captcha-sol';
				return $recaptchaResponse;
			}
			
            try {
                $response = $this->_send(
                    self::RECAPTCHA_VERIFY_SERVER, 
                    "/recaptcha/api/verify", 
                    array(
                        'privatekey' => $this->private_key, 
                        'remoteip'   => $_SERVER['REMOTE_ADDR'], 
                        'challenge'  => $challenge, 
                        'response'   => $response 
                    ) + $extraParams 
                );
                
                // Get the answers
                if (isset($response[1])) {
                    if (trim($response[0]) == 'true') {
                        $recaptchaResponse->is_valid = true;
                    } else {
                        $recaptchaResponse->is_valid = false;
                        $recaptchaResponse->error = $response[1];
                    }
                } else {
                    $recaptchaResponse->is_valid = false;
                    $recaptchaResponse->error = 'incorrect-server-response';
                }
            } catch (Exception $exc) {
                $recaptchaResponse->is_valid = false;
				$recaptchaResponse->error = $exc->getMessage();
            }
            
            // Return the response
			return $recaptchaResponse;
		}
		
		/**
		 * Encodes the given data into a query string format
		 * 
		 * @param string $data - array of string elements to be encoded
		 * @return string - encoded request
		 */
		protected function _encode($data = null) {
			// The data is mandatory
			if (is_null($data)){
				return null;
			}
			
			// Prepare the result
			$result = array();
			
			// Clean the input
			foreach ((array)$data as $key => $value) {
				$result[] = sprintf ('%s=%s', $key, urlencode(stripslashes($value)));
			}
			
			// Return the result
			return implode('&', $result);
		}
	
		/**
		 * Submits an HTTP POST to a reCAPTCHA server
		 * 
		 * @param string $host Host
		 * @param string $path Path
		 * @param array  $data Data
		 * @param int    $port Port
		 * @return array Response
         * @throws Exception
		 */
		protected function _send($host, $path, $data, $port = 80) {
			// Prepare the data
			$req = $this->_encode($data);
			$http_request  = "POST $path HTTP/1.0\r\n";
			$http_request .= "Host: $host\r\n";
			$http_request .= "Content-Type: application/x-www-form-urlencoded;\r\n";
			$http_request .= "Content-Length: " . strlen ($req) . "\r\n";
			$http_request .= "User-Agent: reCAPTCHA/PHP\r\n";
			$http_request .= "\r\n";
			$http_request .= $req;
			
            // Prepare the response
            $response = '';
			if (false == ($fs = @fsockopen($host, $port, $errno, $errstr, 10))) {
				throw new Exception('could-not-open-socket');
			}
			fwrite($fs, $http_request);
			
			// Read the file
			while (!feof($fs)){
				$response .= fgets($fs, 1160);
			}
			fclose($fs);
            
            // Get the two elements from the response
			$response = explode("\r\n\r\n", $response, 2);
			
            if (isset($response[1])) {
                $response = array_map('trim', explode("\n", $response[1]));
            } else {
                $response = array();
            }

            // Return the response
			return $response;
		}
	}