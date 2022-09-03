export const isInvalid = ( block ) => {
	const { name, isValid, validationIssues } = block;

	if ( ! name ) {
		return false;
	}

	// 無効なブロックに対してのみ、この処理を行う。
	if ( isValid || ! validationIssues.length ) {
		return false;
	}

	return true;
};
