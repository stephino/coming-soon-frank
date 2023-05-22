<?php
/**
 * @package       Stephino.com
 * @link          http://stephino.com
 * @copyright     Copyright 2013, Valentino-Jivko Radosavlevici
 * @license       GPL v3.0 (http://www.gnu.org/licenses/gpl-3.0.txt)
 * 
 * Redistributions of files must retain the above copyright notice.
 */
// Disqus platform query
if (isset($_GET['q'])) {
    // Get the query
    $query = str_replace(array("\'", '\"'), array("'", '"'), urldecode($_GET['q']));

    // Get the current site's root
    $webroot = rtrim(substr($_SERVER['REQUEST_URI'], 0, strpos($_SERVER['REQUEST_URI'], '?')), '/') . '/';

    // Compute the new location
    $location = $webroot . '#' . $query;

    // Redirect the user
    header('location:' . $location);

    // Stop executing the rest of this script
    exit();
}