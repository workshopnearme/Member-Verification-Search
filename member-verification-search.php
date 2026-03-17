<?php
/**
 * Plugin Name: Member Verification Search
 * Plugin URI: https://cloudswired.com.my
 * Description: Search and verify members by ID number using usermeta field. Use shortcode [member_search] to display search form.
 * Version: 1.0.0
 * Author: Shukry Radzi
 * Author URI: https://cloudswired.com.my
 * Text Domain: member-verification-search
 */

if (!defined('ABSPATH')) {
    exit;
}

class Member_Verification_Search {
    
    public function __construct() {
        add_shortcode('member_search', array($this, 'render_search_form'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_styles'));
        add_action('wp_ajax_search_member', array($this, 'ajax_search_member'));
        add_action('wp_ajax_nopriv_search_member', array($this, 'ajax_search_member'));
    }
    
    public function enqueue_styles() {
        wp_enqueue_style('member-verification-search', plugin_dir_url(__FILE__) . 'style.css', array(), '1.0.0');
        
        wp_enqueue_script('qrcodejs', 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js', array(), '1.0.0', true);
        wp_enqueue_script('html2canvas', 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', array(), '1.4.1', true);
        wp_enqueue_script('jspdf', 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', array(), '2.5.1', true);
        wp_enqueue_script('member-verification-search', plugin_dir_url(__FILE__) . 'script.js', array('jquery', 'qrcodejs', 'html2canvas', 'jspdf'), '1.0.0', true);
        
        wp_localize_script('member-verification-search', 'memberSearch', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('member_search_nonce'),
            'plugin_url' => plugin_dir_url(__FILE__),
            'page_url' => get_permalink()
        ));
    }
    
    public function render_search_form() {
        ob_start();
        ?>
        <div class="member-verification-search">
            <div class="mvs-search-box">
                <h3>Member Verification</h3>
                <form id="member-search-form" class="mvs-form">
                    <div class="mvs-input-group">
                        <label for="id_number">Enter ID Number:</label>
                        <input type="text" id="id_number" name="id_number" placeholder="Enter member ID number" required>
                    </div>
                    <button type="submit" class="mvs-btn">Search Member</button>
                </form>
            </div>
            
            <div id="mvs-result" class="mvs-result" style="display:none;"></div>
            <div id="mvs-loading" class="mvs-loading" style="display:none;">
                <span class="mvs-spinner"></span> Searching...
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
    
    public function ajax_search_member() {
        check_ajax_referer('member_search_nonce', 'nonce');
        
        $id_number = sanitize_text_field($_POST['id_number']);
        
        if (empty($id_number)) {
            wp_send_json_error(array('message' => 'Please enter an ID number.'));
        }
        
        global $wpdb;
        
        $user_id = $wpdb->get_var($wpdb->prepare(
            "SELECT user_id FROM {$wpdb->usermeta} 
            WHERE meta_key = 'id_number' 
            AND meta_value = %s 
            LIMIT 1",
            $id_number
        ));
        
        if ($user_id) {
            $user = get_userdata($user_id);
            
            if ($user) {
                $avatar_url = get_avatar_url($user_id, array('size' => 150));
                
                $response = array(
                    'found' => true,
                    'name' => $user->display_name,
                    'email' => $user->user_email,
                    'id_number' => $id_number,
                    'username' => $user->user_login,
                    'registered' => date('d M Y', strtotime($user->user_registered)),
                    'avatar' => $avatar_url,
                    'member_since' => date('Y', strtotime($user->user_registered)),
                    'status' => 'Active'
                );
                
                wp_send_json_success($response);
            }
        }
        
        wp_send_json_error(array('message' => 'Member not found. This ID number is not registered.'));
    }
}

new Member_Verification_Search();
