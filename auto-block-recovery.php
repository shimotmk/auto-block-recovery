<?php
/**
 * Plugin Name:       Auto Block Recovery
 * Description:       This plugin automatically attempts block recovery.
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Version:           0.1.6
 * Stable tag:        0.1.6
 * Author:            Tomoki Shimomura
 * Author URI:        https://github.com/shimotmk
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       auto-block-recovery
 *
 * @package           auto-block-recovery
 */

add_action(
	'enqueue_block_editor_assets',
	function () {
		$asset = include plugin_dir_path( __FILE__ ) . 'build/index.asset.php';
		wp_enqueue_script(
			'auto-block-recovery',
			plugin_dir_url( __FILE__ ).'build/index.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);
	}
);
