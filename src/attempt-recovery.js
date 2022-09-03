/**
 * WordPress dependencies
 */
import { select, dispatch, subscribe } from '@wordpress/data';
import {
	createBlock,
	parse,
	serialize,
	getBlockType,
	isReusableBlock,
} from '@wordpress/blocks';
import { isInvalid } from './is-invalid';
import { __ } from '@wordpress/i18n';

// This plugin is based on the code at the following URL.
// https://github.com/WordPress/gutenberg/issues/16425#issuecomment-652910137
// https://github.com/brainstormforce/ultimate-addons-for-gutenberg/blob/d1dfc15b348c5a59a1394bb2d7f3bcecddb7a2f1/blocks-config/uagb-controls/autoBlockRecovery.js
// https://github.com/gambitph/Stackable/blob/47258bd06ee797b58e2a5e1ec3d2357ad9d98a14/src/deprecated/v2/plugins/auto-block-recovery/attempt-recovery.js
// https://wpstackable.com/blog/how-to-recover-all-broken-blocks-in-one-command-in-wordpress/

// Runs an auto-attempt recovery on all the blocks.
export const autoAttemptRecovery = () => {
	setTimeout( () => {
		const unsubscribe = subscribe( () => {
			if (
				select( 'core' ).getEntityRecords( 'postType', 'wp_block' ) !==
				null
			) {
				unsubscribe();
				const mainBlocks = recoverBlocks(
					select( 'core/block-editor' ).getBlocks()
				);
				// Replace the recovered blocks with the new ones.
				mainBlocks.forEach( ( block ) => {
					if ( block.isReusable && block.ref ) {
						// Update the reusable blocks.
						dispatch( 'core' )
							.editEntityRecord(
								'postType',
								'wp_block',
								block.ref,
								{ content: serialize( block.blocks ) }
							)
							.then();
					}

					if ( block.recovered && block.replacedClientId ) {
						dispatch( 'core/block-editor' ).replaceBlock(
							block.replacedClientId,
							block
						);
					}
				} );
			}
		} );
	}, 0 );
};

// 再帰的にリカバリーを行う
const recursivelyRecoverInvalidBlockList = ( blocks ) => {
	const currentBlocks = [ ...blocks ];
	let isRecovered = false;
	const recursivelyRecoverBlocks = ( willRecoverBlocks ) => {
		willRecoverBlocks.forEach( ( block ) => {
			if ( isInvalid( block ) ) {
				isRecovered = true;
				const newBlock = recoverBlock( block );
				for ( const key in newBlock ) {
					block[ key ] = newBlock[ key ];
				}
			}

			if ( block.innerBlocks.length ) {
				recursivelyRecoverBlocks( block.innerBlocks );
			}
		} );
	};

	recursivelyRecoverBlocks( currentBlocks );
	return [ currentBlocks, isRecovered ];
};

// start recovery blocks
export const recoverBlocks = ( allBlocks ) => {
	return allBlocks.map( ( block ) => {
		const currentBlock = block;

		// 再利用ブロックの時
		if ( isReusableBlock( getBlockType( block.name ) ) ) {
			const {
				attributes: { ref },
			} = block;
			const parsedBlocks =
				parse(
					select( 'core' ).getEntityRecords( 'postType', 'wp_block', {
						include: [ ref ],
					} )?.[ 0 ]?.content?.raw
				) || [];

			const [ recoveredBlocks, isRecovered ] =
				recursivelyRecoverInvalidBlockList( parsedBlocks );

			if ( isRecovered ) {
				consoleMessage( currentBlock );
				return {
					blocks: recoveredBlocks,
					isReusable: true,
					ref,
				};
			}
		}

		if ( currentBlock.innerBlocks && currentBlock.innerBlocks.length ) {
			const newInnerBlocks = recoverBlocks( currentBlock.innerBlocks );
			if (
				newInnerBlocks.some( ( InnerBlock ) => InnerBlock.recovered )
			) {
				currentBlock.innerBlocks = newInnerBlocks;
				currentBlock.replacedClientId = currentBlock.clientId;
				currentBlock.recovered = true;
			}
		}

		if ( isInvalid( currentBlock ) ) {
			const newBlock = recoverBlock( currentBlock );
			newBlock.replacedClientId = currentBlock.clientId;
			newBlock.recovered = true;
			consoleMessage( currentBlock );
			return newBlock;
		}

		return currentBlock;
	} );
};

// Recovers one block.
export const recoverBlock = ( { name, attributes, innerBlocks } ) => {
	return createBlock( name, attributes, innerBlocks );
};

// console message
const consoleMessage = ( block ) => {
	const message =
		'%c' +
		__( 'Notice: ', 'auto-block-recovery' ) +
		block.name +
		__( ' was auto recovery.', 'auto-block-recovery' ) +
		'\n' +
		__(
			'Please check this page in preview and update this page.',
			'auto-block-recovery'
		);

	//eslint-disable-next-line no-console
	console.log(
		message,
		'width: 100%; padding: 6px 12px; background-color: #fef8ee; color: #1e1e1e;'
	);
};
