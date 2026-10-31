/**
 * Adds a FocalPointPicker above GenerateBlocks' "Object Position" field
 * (#gblocks-object-position) and writes the selection into that field.
 *
 * Writing through the field (instead of the block attributes) lets GenerateBlocks
 * handle device/state targeting (Desktop/Tablet/Mobile, :hover, etc.) and
 * regenerate the block CSS itself.
 */
( function ( wp ) {
	const { createElement: el, createRoot, useState, useEffect } = wp.element;
	const { FocalPointPicker } = wp.components;
	const { useSelect } = wp.data;
	const { __ } = wp.i18n;

	const FIELD_ID = 'gblocks-object-position';
	const MARK = 'data-pcil-focal-picker';
	const KEYWORDS = { left: 0, top: 0, center: 0.5, right: 1, bottom: 1 };
	const roots = new Map();

	// "87% 50%" | "left top" | "center" -> { x, y }
	function parse( value ) {
		const parts = String( value || '' ).trim().split( /\s+/ ).filter( Boolean );
		const num = ( p ) => {
			if ( p in KEYWORDS ) return KEYWORDS[ p ];
			const n = parseFloat( p );
			return /%$/.test( p ) && ! isNaN( n ) ? Math.min( 1, Math.max( 0, n / 100 ) ) : 0.5;
		};
		if ( ! parts.length ) return { x: 0.5, y: 0.5 };
		// Single keyword like "top" or "left".
		if ( parts.length === 1 ) {
			const p = parts[ 0 ];
			if ( p === 'top' || p === 'bottom' ) return { x: 0.5, y: num( p ) };
			return { x: num( p ), y: 0.5 };
		}
		let [ a, b ] = parts;
		// Allow "top left" ordering.
		if ( a === 'top' || a === 'bottom' || b === 'left' || b === 'right' ) [ a, b ] = [ b, a ];
		return { x: num( a ), y: num( b ) };
	}

	const format = ( p ) => `${ Math.round( p.x * 100 ) }% ${ Math.round( p.y * 100 ) }%`;

	// Set the field the way a user typing would, so GenerateBlocks' React onChange fires.
	const nativeSetter = Object.getOwnPropertyDescriptor( HTMLInputElement.prototype, 'value' ).set;
	function writeToField( input, value ) {
		nativeSetter.call( input, value );
		input.dispatchEvent( new Event( 'input', { bubbles: true } ) );
	}

	function Picker( { input } ) {
		const [ value, setValue ] = useState( () => parse( input.value ) );

		// Stay in sync when the field is typed in or GB swaps device/state.
		useEffect( () => {
			const sync = () => setValue( parse( input.value ) );
			input.addEventListener( 'input', sync );
			input.addEventListener( 'change', sync );
			const timer = setInterval( sync, 500 );
			return () => {
				input.removeEventListener( 'input', sync );
				input.removeEventListener( 'change', sync );
				clearInterval( timer );
			};
		}, [ input ] );

		const url = useSelect( ( select ) => {
			const block = select( 'core/block-editor' ).getSelectedBlock();
			const a = ( block && block.attributes ) || {};
			return ( a.htmlAttributes && a.htmlAttributes.src ) || a.url || undefined;
		}, [] );

		const update = ( next ) => {
			setValue( next );
			writeToField( input, format( next ) );
		};

		return el(
			'div',
			{ style: { marginBottom: '16px' } },
			el( FocalPointPicker, {
				__nextHasNoMarginBottom: true,
				label: __( 'Focal point' ),
				url,
				value,
				onDrag: update,
				onChange: update,
			} )
		);
	}

	function mount() {
		// Clean up pickers whose field has gone away.
		roots.forEach( ( root, container ) => {
			if ( ! container.isConnected ) {
				root.unmount();
				roots.delete( container );
			}
		} );

		const input = document.getElementById( FIELD_ID );
		if ( ! input ) return;

		const control = input.closest( '.gb-styles-builder-control' ) || input.closest( '.components-base-control' ) || input.parentElement;
		if ( ! control || ( control.previousElementSibling && control.previousElementSibling.hasAttribute( MARK ) ) ) return;

		const container = document.createElement( 'div' );
		container.setAttribute( MARK, '' );
		control.parentNode.insertBefore( container, control );

		const root = createRoot( container );
		root.render( el( Picker, { input } ) );
		roots.set( container, root );
	}

	wp.domReady( () => {
		new MutationObserver( mount ).observe( document.body, { childList: true, subtree: true } );
		mount();
	} );
} )( window.wp );
