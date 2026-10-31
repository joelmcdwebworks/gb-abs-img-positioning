<?php
/**
 * Plugin Name: GenerateBlocks Absolute Image Positioning
 * Description: Adds a focal point picker above the GenerateBlocks "Object Position" field and writes the selection to it. Also fixes issue where an absolutely positioned image disappears when selected in the block editor.
 * Version:     1.3.0
 * Author:      Joel McDonald | McDonald Web Works
 * Author URI:  https://mcdwebworks.com
 * Requires at least: 6.3
 */

// Shoutout to Kyle Van Deusen of the The Admin Bar for the inspiration for this plugin. Based on limitations he encountered using image blocks instead of image backgrounds. See: https://www.youtube.com/watch?v=75maot9Hnvc&t=5s

defined( 'ABSPATH' ) || exit;

add_action( 'enqueue_block_editor_assets', function () {
	wp_enqueue_script(
		'pcil-image-object-position',
		plugins_url( 'editor.js', __FILE__ ),
		array( 'wp-element', 'wp-components', 'wp-data', 'wp-dom-ready', 'wp-i18n' ),
		filemtime( __DIR__ . '/editor.js' ),
		true
	);
} );

/**
 * Stretch GenerateBlocks media blocks to fill their container in the block editor.
 */
function pcil_enqueue_generateblocks_media_editor_styles() {
	wp_add_inline_style(
		'wp-edit-blocks',
		'.editor-styles-wrapper .block-editor-block-list__block.wp-block-generateblocks-media { position: absolute; inset: 0; }'
	);
}
add_action( 'enqueue_block_editor_assets', 'pcil_enqueue_generateblocks_media_editor_styles' );
