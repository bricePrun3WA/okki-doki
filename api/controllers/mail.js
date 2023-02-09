import nodemailer from "nodemailer";
import inlineBase64 from 'nodemailer-plugin-inline-base64';

import { base64LogoWhite } from "../utils/variables.js";

// Fonction d'envoi de mail de manière générale
async function sendMail(params, htmlContent = '', othAttach = []) {
    return new Promise((resolve, reject) => {
        /////////////////////////////////////
        // CONNEXION AU MAIL
        /////////////////////////////////////
        const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                user: 'brice.prunier@3wa.io',
                pass: 'khpqllccnozjnkrs'
            }
        });

        /////////////////////////////////////
        // CONTENU CSS DE LA PAGE
        /////////////////////////////////////
        const bkgHeader = `
                background-color: rgb(30, 30, 30);
                color: rgb(255, 255, 255);
            `;

        const cssMain = `
                background-color: rgb(224, 192, 232);
                color: rgb(15, 15, 15);
                padding: 1em 2em;
            `;

        const cssFooter = `
                background-color: rgb(15, 15, 15);
                color: rgb(255, 255, 255);

                padding: 1em;
                text-align: center;
            `;

        const cssWrapper = `
                width: 100%;
            `;

        const cssContent = `
                width: 100%;
                border-collapse: collapse;
                text-align:left;
            `;

        const logoOkkiDokki = `
                height: 10em;
            `;

        const buttonCss = `
            display: inline-block;
            margin: 0.5rem;
            padding: 1rem;

            border: none;
            border-radius: 0.5rem;

            text-transform: uppercase;
            cursor: pointer;
        `;

        const buttonSuccess = `
            background-color: rgb(109, 38, 224);
            color: rgb(255, 255, 255);
        `;

        const buttonSecondary = `
            background-color: rgb(195, 73, 226);
            color: rgb(255, 255, 255);
        `;

        const buttonDanger = `
            background-color: rgb(224, 53, 53);
            color: rgb(255, 255, 255);
        `;

        const highlight = `
            color: rgb(195, 73, 226);
        `;

        const textAlign = `
            text-align: center;
        `;

        const topLeftTable = `
            border-top-left-radius: 1em;
        `;

        const topRightTable = `
            border-top-right-radius: 1em;
        `;

        const leftTable = `
            padding: 1em;
            background-color: rgb(15,15,15);
            color: rgb(238,238,238);
        `;

        const rightTable = `
            padding: 1em;
            background-color: rgb(238,238,238);
            color: rgb(15,15,15);
        `;

        const bottomLeftTable = `
            border-bottom-left-radius: 1em;
        `;

        const bottomRightTable = `
            border-bottom-right-radius: 1em;
        `;
        /////////////////////////////////////

        /////////////////////////////////////
        // Remplacement des contenus utilisés
        /////////////////////////////////////

        const styledHtmlContent = htmlContent
                                        .replaceAll('%textAlign%', textAlign)
                                        .replaceAll('%highlight%', highlight)
                                        .replaceAll('%buttonCss%', buttonCss)

                                        .replaceAll('%topLeftTable%', topLeftTable)
                                        .replaceAll('%topRightTable%', topRightTable)
                                        .replaceAll('%leftTable%', leftTable)
                                        .replaceAll('%rightTable%', rightTable)
                                        .replaceAll('%bottomLeftTable%', bottomLeftTable)
                                        .replaceAll('%bottomRightTable%', bottomRightTable)

                                        .replaceAll('%buttonSuccess%', buttonSuccess)
                                        .replaceAll('%buttonSecondary%', buttonSecondary)
                                        .replaceAll('%buttonDanger%', buttonDanger);
        const attachements = othAttach;

        transporter.use('compile', inlineBase64({cidPrefix: 'okdok_'}));

        /////////////////////////////////////

        /////////////////////////////////////
        // CONTENU HTML DE LA PAGE
        /////////////////////////////////////
        const yearNow = new Date().getFullYear();
        let message = `
                <!DOCTYPE html>
                <html lang="fr">
                    <head>
                        <title></title>
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,700;1,400;1,700&display=swap');
                            * {
                                font-family: 'Montserrat', sans-serif;
                            }
                        </style>
                    </head>
                    <body style="margin: 0; padding: 0;">
                        <table style="${cssWrapper}">
                            <tr>
                                <td align="center" style="padding:0;">
                                    <table style="${cssContent}">
                                        <thead>
                                            <tr>
                                                <th align="center" style="${bkgHeader}">
                                                    <img src="${base64LogoWhite}"
                                                        alt="Logo de l'application OKKI DOKI" style="${logoOkkiDokki}" />
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td style="${cssMain}">
                                                    ${styledHtmlContent}
                                                </td>
                                            </tr>
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <th style="${cssFooter}">
                                                    &copy; OKKI DOKI - ${yearNow}
                                                </th>
                                            </tr>
                                        <tfoot>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                </html>
            `;
        /////////////////////////////////////

        /////////////////////////////////////
        // PARAMS DU MAIL
        /////////////////////////////////////
        const mailOptions = {
            ...params,
            from: {
                name: "OKKI DOKI",
                address: 'brice.prunier@3wa.io'
            },
            html: message,
            attachements: attachements
        };

        // ENVOI DU MAIL
        transporter.sendMail(mailOptions, (error, info) => {
            resolve (
                error ?
                    "NOK"
                :
                    "OK"
            );
        });
    });
}

export {
    sendMail
}