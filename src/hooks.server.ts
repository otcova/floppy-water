import type { Handle } from "@sveltejs/kit";
import { minify } from "html-minifier";

const minification_options = {
	collapseBooleanAttributes: true,
	collapseWhitespace: true,
	decodeEntities: true,
	html5: true,
	ignoreCustomComments: [/^#/],
	minifyCSS: true,
	minifyJS: true,
	removeAttributeQuotes: true,
	removeComments: true,
	removeRedundantAttributes: true,
	removeScriptTypeAttributes: true,
	removeStyleLinkTypeAttributes: true,
	sortAttributes: true,
	sortClassName: true,
	removeEmptyElements: true
};

export const handle: Handle = async ({ resolve, event }) => {
	const response = await resolve(event);
	
	if (response.headers.get("Content-Type") === "text/html") {
		const txt = minify(await response.text(), minification_options);
		response.headers.set("Content-Length", txt.length.toString());
		return new Response(txt, {
			status: response.status,
			headers: response.headers,
		});
	}

	return response;
};
