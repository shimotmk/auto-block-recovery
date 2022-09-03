/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { autoAttemptRecovery } from './attempt-recovery';

export const initAutoAttemptRecovery = () => {
	if ( window._wpLoadBlockEditor ) {
		window._wpLoadBlockEditor.then( () => {
			autoAttemptRecovery();
		} );
	}
};

domReady( initAutoAttemptRecovery );
