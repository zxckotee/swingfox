<?php

function setGeo(){
  $ch = curl_init();

  $res = file_get_contents("http://ip-api.com/json/".$_SERVER['REMOTE_ADDR']);
  
  $res = json_decode($res, true);
  $userGeo = $res['lat'].'&&'.$res['lon'];
  
  return $userGeo;
}


function myMail($email, $subject, $mess){
    $mess = explode("&&", $mess);
    if (isset($mess[1])){
        $code = "Ваш код: <strong>{$mess[1]}</strong>";
    } else { 
        $code = "";
    }
    $message = "
    <!DOCTYPE html><html xmlns='http://www.w3.org/1999/xhtml'><head>
  <meta content='text/html; charset=utf-8' http-equiv='Content-Type'>
  <meta content='width=device-width' name='viewport'>
  
  
  <style>body {
  width: 100% !important; min-width: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; margin: 0; padding: 0;
  }
  .ExternalClass {
  width: 100%;
  }
  .ExternalClass {
  line-height: 100%;
  }
  #backgroundTable {
  margin: 0; padding: 0; width: 100% !important; line-height: 100% !important;
  }
  body {
  background-color: #fbfbfb; background-repeat: repeat; background-position: center top;
  }
  body {
  color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; padding: 0; margin: 0; text-align: left; line-height: 1.3;
  }
  a:hover {
  color: #2795b6;
  }
  a:active {
  color: #2795b6;
  }
  a:visited {
  color: #2f3df0;
  }
  h1 a:active {
  color: #2f3df0 !important;
  }
  h2 a:active {
  color: #2f3df0 !important;
  }
  h3 a:active {
  color: #2f3df0 !important;
  }
  h4 a:active {
  color: #2f3df0 !important;
  }
  h5 a:active {
  color: #2f3df0 !important;
  }
  h6 a:active {
  color: #2f3df0 !important;
  }
  h1 a:visited {
  color: #2f3df0 !important;
  }
  h2 a:visited {
  color: #2f3df0 !important;
  }
  h3 a:visited {
  color: #2f3df0 !important;
  }
  h4 a:visited {
  color: #2f3df0 !important;
  }
  h5 a:visited {
  color: #2f3df0 !important;
  }
  h6 a:visited {
  color: #2f3df0 !important;
  }
  table.secondary:hover td {
  background: #d0d0d0 !important; color: #555555;
  }
  table.secondary:hover td a {
  color: #555555 !important;
  }
  table.secondary td a:visited {
  color: #555555 !important;
  }
  table.secondary:active td a {
  color: #555555 !important;
  }
  table.success:hover td {
  background: #457a1a !important;
  }
  table.alert:hover td {
  background: #970b0e !important;
  }
  body.outlook p {
  display: inline !important;
  }
  @media only screen and (min-width: 768px) {
    table.container {
      width: 580px !important;
    }
    .mail .hide-for-desktop {
      display: none !important;
    }
    .mail .hide-and-true {
      display: none !important;
    }
    .mail .hide-and-false {
      display: block !important;
    }
    .mail .hide-or-true {
      display: none !important;
    }
  }
  @media only screen and (max-width: 600px) {
    .mail img {
      max-width: 100% !important; max-height: 100% !important; padding: 0 !important; width: auto !important; height: auto !important;
    }
    .mail .social img {
      width: inherit !important;
    }
    .mail img.normal {
      width: inherit !important;
    }
    .mail center {
      min-width: 0 !important;
    }
    .mail .container {
      width: 100% !important;
    }
    .mail .row {
      width: 100% !important; display: block !important;
    }
    .mail .wrapper {
      display: block !important; padding-right: 0 !important;
    }
    .mail .columns {
      table-layout: fixed !important; float: none !important; width: 100% !important; padding-right: 0px !important; padding-left: 0px !important; display: block !important;
    }
    .mail .column {
      table-layout: fixed !important; float: none !important; width: 100% !important; padding-right: 0px !important; padding-left: 0px !important; display: block !important;
    }
    .mail .wrapper.first .columns {
      display: table !important;
    }
    .mail .wrapper.first .column {
      display: table !important;
    }
    .mail table.columns > tbody > tr > td {
      width: 100% !important; padding-left: 0 !important; padding-right: 0 !important;
    }
    .mail table.column > tbody > tr > td {
      width: 100% !important; padding-left: 0 !important; padding-right: 0 !important;
    }
    .mail .columns td.one {
      width: 8.333333% !important;
    }
    .mail .column td.one {
      width: 8.333333% !important;
    }
    .mail .columns td.two {
      width: 16.666666% !important;
    }
    .mail .column td.two {
      width: 16.666666% !important;
    }
    .mail .columns td.three {
      width: 25% !important;
    }
    .mail .column td.three {
      width: 25% !important;
    }
    .mail .columns td.four {
      width: 33.333333% !important;
    }
    .mail .column td.four {
      width: 33.333333% !important;
    }
    .mail .columns td.five {
      width: 41.666666% !important;
    }
    .mail .column td.five {
      width: 41.666666% !important;
    }
    .mail .columns td.six {
      width: 50% !important;
    }
    .mail .column td.six {
      width: 50% !important;
    }
    .mail .columns td.seven {
      width: 58.333333% !important;
    }
    .mail .column td.seven {
      width: 58.333333% !important;
    }
    .mail .columns td.eight {
      width: 66.666666% !important;
    }
    .mail .column td.eight {
      width: 66.666666% !important;
    }
    .mail .columns td.nine {
      width: 75% !important;
    }
    .mail .column td.nine {
      width: 75% !important;
    }
    .mail .columns td.ten {
      width: 83.333333% !important;
    }
    .mail .column td.ten {
      width: 83.333333% !important;
    }
    .mail .columns td.eleven {
      width: 91.666666% !important;
    }
    .mail .column td.eleven {
      width: 91.666666% !important;
    }
    .mail .columns td.twelve {
      width: 100% !important;
    }
    .mail .column td.twelve {
      width: 100% !important;
    }
    .mail td.offset-by-eleven {
      padding-left: 0 !important;
    }
    .mail td.offset-by-ten {
      padding-left: 0 !important;
    }
    .mail td.offset-by-nine {
      padding-left: 0 !important;
    }
    .mail td.offset-by-eight {
      padding-left: 0 !important;
    }
    .mail td.offset-by-seven {
      padding-left: 0 !important;
    }
    .mail td.offset-by-six {
      padding-left: 0 !important;
    }
    .mail td.offset-by-five {
      padding-left: 0 !important;
    }
    .mail td.offset-by-four {
      padding-left: 0 !important;
    }
    .mail td.offset-by-three {
      padding-left: 0 !important;
    }
    .mail td.offset-by-two {
      padding-left: 0 !important;
    }
    .mail td.offset-by-one {
      padding-left: 0 !important;
    }
    .mail table.columns td.expander {
      width: 1px !important;
    }
    .mail .right-text-pad {
      padding-left: 10px !important;
    }
    .mail .text-pad-right {
      padding-left: 10px !important;
    }
    .mail .left-text-pad {
      padding-right: 10px !important;
    }
    .mail .text-pad-left {
      padding-right: 10px !important;
    }
    .mail .hide-for-small {
      display: none !important;
    }
    .mail .show-for-desktop {
      display: none !important;
    }
    .mail .show-for-small {
      display: block !important; width: auto !important; overflow: visible !important;
    }
    .mail .hide-for-desktop {
      display: block !important; width: auto !important; overflow: visible !important;
    }
    .mail .button-hide-for-small {
      display: none !important;
    }
    .mail .button-show-for-desktop {
      display: none !important;
    }
    .mail .button-show-for-small {
      display: table !important; overflow: visible !important;
    }
    .mail .button-hide-for-desktop {
      display: table !important; overflow: visible !important;
    }
    .mail .hide-and-true {
      display: none !important;
    }
    .mail .hide-and-false {
      display: block !important;
    }
    .mail .hide-or-true {
      display: none !important;
    }
  }
  </style></head>
  <body style='width: 100% !important; min-width: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; text-align: left; line-height: 1.3; background: #fbfbfb repeat center top; margin: 0; padding: 0;' bgcolor='#fbfbfb'>
  <table class='mail' style='border-spacing: 0; border-collapse: collapse; vertical-align: top; text-align: left; height: 100%; width: 100%; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; line-height: 1.3; background: #fbfbfb repeat center top; margin: 0; padding: 0;' bgcolor='#fbfbfb'>
  <tbody><tr style='vertical-align: top; text-align: left; padding: 0;' align='left'>
  <td align='center' class='center' valign='top' style='word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; text-align: center; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; margin: 0; padding: 0;'>
  <center style='width: 100%; min-width: 580px;'>
  <table class='container' style='border-spacing: 0; border-collapse: collapse; vertical-align: top; text-align: inherit; max-width: 580px; margin: 0 auto; padding: 0;'>
  <tbody><tr style='vertical-align: top; text-align: left; padding: 0;' align='left'>
  <td style='word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; text-align: left; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; margin: 0; padding: 0;' align='left' valign='top'>
  <table class='row' style='border-spacing: 0; border-collapse: collapse; vertical-align: top; text-align: left; width: 100%; position: relative; display: block; background: transparent repeat center top; padding: 0px;' bgcolor='transparent'>
  <tbody><tr style='vertical-align: top; text-align: left; padding: 0;' align='left'>
  <td class='wrapper first last' style='word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; text-align: left; position: relative; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; margin: 0; padding: 0px;' align='left' valign='top'>
  <table class='twelve columns' style='border-spacing: 0; border-collapse: collapse; vertical-align: top; text-align: left; width: 580px; margin: 0 auto; padding: 0;'>
  <tbody><tr style='vertical-align: top; text-align: left; padding: 0;' align='left'>
  <td style='word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; text-align: left; width: 100%; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; margin: 0; padding: 0px;' align='left' valign='top'>
  <table style='width: 100%; border-spacing: 0; border-collapse: collapse; vertical-align: top; text-align: left; padding: 0;'>
  <tbody><tr style='vertical-align: top; text-align: left; padding: 0;' align='left'><td class='' style='font-size: 1px; line-height: 0; word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; text-align: left; width: 100%; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; background: transparent repeat center center; margin: 0; padding: 20px 0px 0px;' align='left' bgcolor='transparent' valign='top'>&nbsp;</td>
  </tr></tbody></table>
  
  
  
  
  
  
  </td>
  <td class='expander' style='word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; text-align: left; width: 100%; visibility: hidden; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; margin: 0; padding: 0;' align='left' valign='top'></td>
  </tr>
  </tbody></table>
  </td>
  
  
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  
  
  <table class='container' style='border-spacing: 0; border-collapse: collapse; vertical-align: top; text-align: inherit; max-width: 580px; margin: 0 auto; padding: 0;'>
  <tbody><tr style='vertical-align: top; text-align: left; padding: 0;' align='left'>
  <td style='word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; text-align: left; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; margin: 0; padding: 0;' align='left' valign='top'>
  <table class='row' style='border-spacing: 0; border-collapse: collapse; vertical-align: top; text-align: left; width: 100%; position: relative; display: block; background: transparent repeat center top; padding: 0px;' bgcolor='transparent'>
  <tbody><tr style='vertical-align: top; text-align: left; padding: 0;' align='left'>
  <td class='wrapper first last' style='word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; text-align: left; position: relative; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; margin: 0; padding: 0px;' align='left' valign='top'>
  <table class='twelve columns' style='border-spacing: 0; border-collapse: collapse; vertical-align: top; text-align: left; width: 580px; margin: 0 auto; padding: 0;'>
  <tbody><tr style='vertical-align: top; text-align: left; padding: 0;' align='left'>
  <td style='word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; text-align: left; width: 100%; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; margin: 0; padding: 0px;' align='left' valign='top'>
  <table style='width: 100%; border-spacing: 0; border-collapse: collapse; vertical-align: top; text-align: left; padding: 0;'>
  <tbody><tr style='vertical-align: top; text-align: left; padding: 0;' align='left'><td class='' style='font-size: 1px; line-height: 0; word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; text-align: left; width: 100%; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; background: transparent repeat center center; margin: 0; padding: 20px 0px 0px;' align='left' bgcolor='transparent' valign='top'>&nbsp;</td>
  </tr></tbody></table>
  
  
  
  
  
  
  </td>
  <td class='expander' style='word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; text-align: left; width: 100%; visibility: hidden; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; margin: 0; padding: 0;' align='left' valign='top'></td>
  </tr>
  </tbody></table>
  </td>
  
  
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  
  
  <table class='container' style='border-spacing: 0; border-collapse: collapse; vertical-align: top; text-align: inherit; max-width: 580px; margin: 0 auto; padding: 0;'>
  <tbody><tr style='vertical-align: top; text-align: left; padding: 0;' align='left'>
  <td style='word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; text-align: left; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; margin: 0; padding: 0;' align='left' valign='top'>
  <table class='row' style='border-radius: 20px; -webkit-border-radius: 20px; -moz-border-radius: 20px; border-spacing: 0; border-collapse: collapse; vertical-align: top; text-align: left; width: 100%; position: relative; display: block; background: #efefef repeat center top; padding: 10px 0;' bgcolor='#efefef'>
  <tbody><tr style='vertical-align: top; text-align: left; padding: 0;' align='left'>
  <td class='wrapper first last' style='word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; text-align: left; position: relative; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; margin: 0; padding: 0px;' align='left' valign='top'>
  <table class='twelve columns' style='border-spacing: 0; border-collapse: collapse; vertical-align: top; text-align: left; width: 580px; margin: 0 auto; padding: 0;'>
  <tbody><tr style='vertical-align: top; text-align: left; padding: 0;' align='left'>
  <td style='word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; text-align: left; width: 100%; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; margin: 0; padding: 40px 20px;' align='left' valign='top'>
  <table align='left' style='border-collapse: collapse; border-spacing: 0; overflow: hidden; width: 100%; vertical-align: top; text-align: left; padding: 0; border: 0;'>
  <tbody><tr style='vertical-align: top; text-align: left; padding: 0;' align='left'>
  <td align='left' style='text-align: left; word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; width: 100%; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; margin: 0; padding: 0px 20px;' valign='top'>
  <!--[if mso]>
  <img alt='logo.png' src='https://app.makemail.ru/content/73bc96eacdc6c127da9c8bbd34aaa3ad.png' width='275'>
  <![endif]-->
  <!--[if !mso]> <!---->
  <img alt='logo.png' class='left' height='117' src='https://app.makemail.ru/content/73bc96eacdc6c127da9c8bbd34aaa3ad.png' style='width: 275px !important; height: 117px; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; max-width: 100%; float: left; clear: both; display: block;' width='275' align='left'>
  <!-- <![endif]-->
  </td>
  </tr>
  </tbody></table>
  
  
  
  
  <table style='width: 100%; border-spacing: 0; border-collapse: collapse; vertical-align: top; text-align: left; padding: 0;'>
  <tbody><tr style='vertical-align: top; text-align: left; padding: 0;' align='left'><td class='' style='font-size: 1px; line-height: 0; word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; text-align: left; width: 100%; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; background: transparent repeat center center; margin: 0; padding: 20px 0px 0px;' align='left' bgcolor='transparent' valign='top'>&nbsp;</td>
  </tr></tbody></table>
  
  
  
  
  <table class='table-block' width='100%' style='border-spacing: 0; border-collapse: collapse; vertical-align: top; text-align: left; padding: 0;'>
  <tbody><tr style='vertical-align: top; text-align: left; padding: 0;' align='left'>
  <td class='' style='word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; text-align: left; width: 100%; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; background: transparent repeat center center; margin: 0; padding: 0px 0px 0px 20px;' align='left' bgcolor='transparent' valign='top'>
  <h1 style='text-align: left; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 24px; line-height: 1.3; word-break: normal; margin: 0; padding: 0;' align='left'><strong>Команда swingfox.ru</strong></h1>
  <p style='color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; text-align: left; line-height: 1.3; margin: 0 0 10px; padding: 0;' align='left'><span style='line-height: 45px;'><strong>{$subject}</strong></span></p>
  </td>
  </tr>
  </tbody></table>
  
  
  
  
  <table style='width: 100%; border-spacing: 0; border-collapse: collapse; vertical-align: top; text-align: left; padding: 0;'>
  <tbody><tr style='vertical-align: top; text-align: left; padding: 0;' align='left'><td class='' style='font-size: 1px; line-height: 0; word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; text-align: left; width: 100%; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; background: transparent repeat center center; margin: 0; padding: 10px 0px 0px;' align='left' bgcolor='transparent' valign='top'>&nbsp;</td>
  </tr></tbody></table>
  
  
  
  
  <table class='table-block' width='100%' style='border-spacing: 0; border-collapse: collapse; vertical-align: top; text-align: left; padding: 0;'>
  <tbody><tr style='vertical-align: top; text-align: left; padding: 0;' align='left'>
  <td class='' style='word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; text-align: left; width: 100%; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; background: transparent repeat center center; margin: 0; padding: 0px 0px 0px 20px;' align='left' bgcolor='transparent' valign='top'>
  <p style='text-align: left; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; line-height: 1.3; margin: 0 0 10px; padding: 0;' align='left'>{$mess[0]}</p>
  <p style='text-align: left; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; line-height: 1.3; margin: 0 0 10px; padding: 0;' align='left'>{$code}</p>
  </td>
  </tr>
  </tbody></table>
  
  
  
  
  <table style='width: 100%; border-spacing: 0; border-collapse: collapse; vertical-align: top; text-align: left; padding: 0;'>
  <tbody><tr style='vertical-align: top; text-align: left; padding: 0;' align='left'><td class='' style='font-size: 1px; line-height: 0; word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; text-align: left; width: 100%; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; background: transparent repeat center center; margin: 0; padding: 20px 0px 0px;' align='left' bgcolor='transparent' valign='top'>&nbsp;</td>
  </tr></tbody></table>
  
  
  
  
  <table style='width: 100%; border-spacing: 0; border-collapse: collapse; vertical-align: top; text-align: left; padding: 0;'>
  <tbody><tr style='vertical-align: top; text-align: left; padding: 0;' align='left'><td class='' style='font-size: 1px; line-height: 0; word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; text-align: left; width: 100%; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; background: transparent repeat center center; margin: 0; padding: 20px 0px 0px;' align='left' bgcolor='transparent' valign='top'>&nbsp;</td>
  </tr></tbody></table>
  
  
  
  
  <table class='table-block' width='100%' style='border-spacing: 0; border-collapse: collapse; vertical-align: top; text-align: left; padding: 0;'>
  <tbody><tr style='vertical-align: top; text-align: left; padding: 0;' align='left'>
  <td class='' style='word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; text-align: left; width: 100%; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; background: transparent repeat center center; margin: 0; padding: 0px 20px;' align='left' bgcolor='transparent' valign='top'>
  <p style='text-align: left; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; line-height: 1.3; margin: 0 0 10px; padding: 0;' align='left'>С наилучшими пожеланиями,<br><strong>Команда сайта swingfox.ru</strong></p>
  </td>
  </tr>
  </tbody></table>
  
  
  
  
  
  
  </td>
  <td class='expander' style='word-break: break-word; -webkit-hyphens: none; -moz-hyphens: none; hyphens: none; border-collapse: collapse !important; vertical-align: top; text-align: left; width: 100%; visibility: hidden; color: #39354e; font-family: Arial, sans-serif; font-weight: normal; font-size: 16px; margin: 0; padding: 0;' align='left' valign='top'></td>
  </tr>
  </tbody></table>
  </td>
  
  
  </tr>
  </tbody></table>
  </td>
  </tr>
  </tbody></table>
  
  
  
  
  </center>
  </td>
  </tr>
  </tbody></table>
  
  
  
  
  
  </body></html>
  
  
    "; 
    // headers ***
    $headers  = 'MIME-Version: 1.0' . "\r\n";
    $headers .= 'Content-type: text/html; charset=UTF-8' . "\r\n";
    $headers .= 'From: info@swingfox.ru' . "\r\n";
    $headers .= 'Reply-To: info@swingfox.ru' . "\r\n";

    if (mail($email,$subject,$message, $headers)){
        return true;
    } else {
        return false;
    }
    return false;
}


session_set_cookie_params(259200,"/");
ini_set('session.cookie_lifetime', '259200');
session_start();


$host = "localhost";
$user = "kolomigs_swing";
$password = "44445555Mm";
$db = "kolomigs_swing";

/*$host = "localhost";
$user = "root";
$password = "";
$db = "kolomigs_swing";*/

$link = mysqli_connect($host,$user,$password,$db);

if (isset($_POST['geoReload'])){
  if (isset($_SESSION['user'])){
    $login = $_SESSION['user'];
    if (isset($_SESSION['geoSets'])){
      if (time() - $_SESSION['geoSets'] >= 86400){
        $geo = setGeo();
      } else {
        $geo = 'geoSets';
      }
    } else {
      $geo = setGeo();
    }
    // mysqli
    if ($geo != 'geoSets'){
      if ($geo != '' && $geo !== null && $geo !== FALSE){
        mysqli_query($link, "UPDATE `users` SET `geo` = '{$geo}' WHERE `login` = '{$login}'");
        $_SESSION['geoSets'] = time();
      } else {$response = 'error';}
    } else {$response = 'geoSets';}

  } else {  
    $response = 'no_session';
  }
  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

function id(){
    $id = time();
    for ($i = 0; $i < 3; $i++){
        $id .= rand(0,9); 
    }
    return $id;
}

if (isset($_POST['check_user_session'])){
    if (isset($_SESSION['user'])){
        $response = 'true';
    } else {
        $response = 'false';
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

function distance($lat_1, $lon_1, $lat_2, $lon_2) {

	$radius_earth = 6371; 

	$lat_1 = deg2rad($lat_1);
	$lon_1 = deg2rad($lon_1);
	$lat_2 = deg2rad($lat_2);
	$lon_2 = deg2rad($lon_2);

	$d = 2 * $radius_earth * asin(sqrt(sin(($lat_2 - $lat_1) / 2) ** 2 + cos($lat_1) * cos($lat_2) * sin(($lon_2 - $lon_1) / 2) ** 2));

	return number_format($d, 3, '.', '');

}

if (isset($_SESSION['user'])){
  $permiss = mysqli_query($link,"SELECT * FROM `subs` WHERE `login`='{$_SESSION['user']}'");
  while ($result = mysqli_fetch_array($permiss)){
    $_SESSION['permiss'] = $result['viptype'];
  }
}
if (isset($_POST['getVipType'])){
  if (isset($_SESSION['user']) && isset($_SESSION['permiss'])){
    $response = $_SESSION['permiss'];
  } else {
    $response = 'error';
  }
  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['sliderShow'])){
    $response = "";
    if (isset($_SESSION['user'])){
      if ($_POST['sliderShow'] != 'back'){
        $data = mysqli_query($link,"SELECT * FROM `users` WHERE `login` != '{$_SESSION['user']}' AND `viptype`!='FREE' ORDER BY RAND() LIMIT 1");
      } else {
        if (isset($_SESSION['last_slide']) && count(explode("&&",$_SESSION["last_slide"])) >= 2){
            if ($_SESSION['permiss'] != 'FREE'){
                $last_slide = explode("&&",$_SESSION["last_slide"]);
                $key = array_key_first($last_slide);
                $data = mysqli_query($link,"SELECT * FROM `users` WHERE `login`='{$last_slide[$key]}'");
            } else {
                $response = "permiss_error";
            }
        } else {
            $response = "no_last";
        }
      }
    } else {
        $response = "no_login";
    }
    if ($response == ""){
        while ($result = mysqli_fetch_array($data)){
          list($id, $login, $email, $password, $ava, $status, $country,$city, $geo, $registration, $info, $online, $viptype, $images, $search_status, $search_age, $location, $mobile, $height, $weight, $smoking, $alko, $date, $balance, $locked_images, $images_password) = $result;
        }

        // ages and distance !!! --> 

        function toMetric($age){
          $last = $age % 10;
          if ($last == 1){
            $metric = 'год';
          } if ($last > 1 && $last < 5){
            $metric = 'года';
          } if ($last >= 5 || $last == 0){
            $metric = 'лет';
          }
          return $metric;
        }

        $now = strtotime(date("Y-m-d"));
        //$age = ($now - strtotime($date)) / 31536000;

        $geo = explode("&&",$geo);

        $me = mysqli_query($link, "SELECT * FROM `users` WHERE `login`='{$_SESSION['user']}'");
        while ($me_data = mysqli_fetch_array($me)){
          $userGeo = explode("&&",$me_data['geo']);
        }
        
        $date = explode("_", $date);
        $now = strtotime('now');
        if (count($date) == 2){
          $time1 = $now - strtotime($date[0]);
          $age1 = intdiv($time1, 31536000);  
          $toMetric1 = toMetric($age1);

          $time2 = $now - strtotime($date[1]);
          $age2 = intdiv($time2, 31536000);
          $toMetric2 = toMetric($age2);

          $age = "{$age1} {$toMetric1} (М) / {$age2} {$toMetric2} (Ж)";
        } else {
          $time = $now - strtotime($date[0]);
          $age = intdiv($time, 31536000);
          $toMetric = toMetric($age);
          $age = "{$age} {$toMetric}"; 
        }
        $dist = distance($geo[0],$geo[1],$userGeo[0],$userGeo[1]);
        $dist = round($dist);
         
        $response = implode("&&",[$id,$login,$ava,$age,$status,$city,$dist,$registration,$info,$online]);
        if (count(explode("&&", $_SESSION["last_slide"])) >= 2){
            $_SESSION["last_slide"] .= "&&".$login;
            $last_slide = explode("&&", $_SESSION["last_slide"]);
            array_shift($last_slide);
            $_SESSION["last_slide"] = implode("&&", $last_slide);
        } else {
            $_SESSION["last_slide"] = $login;
        }
    }
    

    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['slideLike'])){
    if (isset($_SESSION['user']) && isset($_SESSION['last_slide'])){
        $me = $_SESSION['user'];
        $me_list = mysqli_query($link, "SELECT * FROM `users` WHERE `login`='{$me}'");
        while ($me_res = mysqli_fetch_array($me_list)){
            $viptype = $me_res['viptype'];
        }

        $last_slides = explode("&&",$_SESSION['last_slide']);

        if (count($last_slides) > 1){
            $user_like = $last_slides[1];
        } else {
            $user_like = $last_slides[0];
        }
        $today = date("Y-m-d"); $id = id(); 
        if ($viptype != 'free'){
            $my_empty_likes = mysqli_query($link, "SELECT * FROM `likes` WHERE `lito`='{$me}' AND `recip`='empty' AND `lifrom`='{$user_like}'");
            if (mysqli_num_rows($my_empty_likes) > 0 ){
                mysqli_query($link, "UPDATE `likes` SET `recip`='yes' WHERE `lito`='{$me}' AND `lifrom`='{$user_like}'");
                $response = 'recip_like';
            } else {
                mysqli_query($link, "INSERT INTO `likes`(`id`, `date`, `lifrom`, `lito`, `recip`, `super`) VALUES ('{$id}','{$today}','{$me}','{$user_like}', 'empty', '0')");
                $response = 'success';
            }
          mysqli_query($link, "INSERT INTO `notifs`(`id`, `by`, `to`, `type`, `mess`) VALUES ('{$id}', '{$me}' ,'{$user_like}', 'like', '0')");
        } else {
            $my_likes = mysqli_query($link, "SELECT * FROM `likes` WHERE `date` >= '{$today}' AND `lito` = '{$me}'");
            if (mysqli_num_rows($my_likes) < 50){
                $my_empty_likes = mysqli_query($link, "SELECT * FROM `likes` WHERE `lito`='{$me}' AND `recip`='empty' AND `lifrom`='{$user_like}'");
                if (mysqli_num_rows($my_empty_likes) > 0 ){
                    mysqli_query($link, "UPDATE `likes` SET `recip`='yes' WHERE `lito`='{$me}' AND `lifrom`='{$user_like}'");
                    $response = 'recip_like';
                } else {
                    mysqli_query($link, "INSERT INTO `likes`(`id`, `date`, `lifrom`, `lito`, `recip`, `super`) VALUES ('{$id}','{$today}','{$me}','{$user_like}', 'empty', '0')");
                    $response = 'success';
                }
                mysqli_query($link, "INSERT INTO `notifs`(`id`, `by`, `to`, `type`, `mess`) VALUES ('{$id}', '{$me}' ,'{$user_like}', 'like', '0')");
            } else {
                $response = 'like_limit';
            }
        }
    } else {
        $response = 'no_session';
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['slideDislike'])){
    if (isset($_SESSION['user']) && isset($_SESSION['last_slide'])){
        $me = $_SESSION['user'];

        $last_slides = explode("&&",$_SESSION['last_slide']);

        if (count($last_slides) > 1){
            $user_dislike = $last_slides[1];
        } else {
            $user_dislike = $last_slides[0];
        }

        $my_empty_likes = mysqli_query($link, "SELECT * FROM `likes` WHERE `lito`='{$me}' AND `recip`='empty' AND `lifrom`='{$user_dislike}'");
        if (mysqli_num_rows($my_empty_likes) > 0 ){
            mysqli_query($link, "UPDATE `likes` SET `recip`='no' WHERE `lito`='{$me}' AND `lifrom`='{$user_dislike}'");
            $response = 'recip_dis';
        } else {
            $response = 'forward';
        }
    } else {
        $response = 'no_session';
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['slideSuperlike'])){
    if (isset($_SESSION['user']) && isset($_SESSION['last_slide'])){
        $me = $_SESSION['user'];
        $mess = $_POST['slideSuperlike'];

        $last_slides = explode("&&",$_SESSION['last_slide']);

        if (count($last_slides) > 1){
            $user_superlike = $last_slides[1];
        } else {
            $user_superlike = $last_slides[0];
        }
        $me_data = mysqli_query($link, "SELECT * FROM `users` WHERE `login`='{$me}'");
        while ($m_d = mysqli_fetch_array($me_data)){
            $viptype = $m_d['viptype'];
        }
        
        $today = date("Y-m-d"); $id = id(); 

        $my_supers = mysqli_query($link, "SELECT * FROM `likes` WHERE `date` >= '{$today}'  AND `super` != '0' AND `lifrom` = '{$me}'");
        $root = 1;
        if ($viptype == 'VIP' && mysqli_num_rows($my_supers) >= 5){$root=2;}
        if ($viptype == 'PREMIUM' && mysqli_num_rows($my_supers) >= 10){$root=2;}
        if ($viptype == 'FREE'){$root=0;}

        if ($root == 1){
            mysqli_query($link, "INSERT INTO `likes`(`id`, `date`, `lifrom`, `lito`, `recip`,`super`) VALUES ('{$id}','{$today}','{$me}','{$user_superlike}', 'empty', '{$mess}')");
            $response = 'success';
            mysqli_query($link, "INSERT INTO `notifs`(`id`, `by`, `to`, `type`, `mess`) VALUES ('{$id}', '{$me}' ,'{$user_superlike}', 'superlike', '{$mess}')");
            mysqli_query($link, "UPDATE `likes` SET `recip`='yes' WHERE `lifrom`='{$user_superlike}' AND `lito`='{$me}'");
          
        } else {
            if ($root == 2){
                $response = 'end_up';
            } else {
                $response = 'no_root';
            }
        }

    } else {
        $response = 'no_session';
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}
if (isset($_POST['superlikeCount_get'])){
    if (isset($_SESSION['user'])){
        $me = $_SESSION['user'];
        $me_data = mysqli_query($link, "SELECT * FROM `users` WHERE `login`='{$me}'");
        while ($m_d = mysqli_fetch_array($me_data)){
            $viptype = $m_d['viptype'];
        }
        if ($viptype != 'FREE'){
            if ($viptype == 'VIP' ){$start_count=5;}
            if ($viptype == 'PREMIUM'){$start_count=10;}

            $today = date("Y-m-d");
            $my_supers = mysqli_query($link, "SELECT * FROM `likes` WHERE `date` >= '{$today}' AND `lifrom` = '{$me}' AND `super` != '0'");
            $my_supers_today_count = mysqli_num_rows($my_supers);
            $total_count = $start_count - $my_supers_today_count;
            $response = "success&&{$total_count}";
        } else {
            $response = "no_root";
        }

    } else {
        $response = 'no_session';
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['logIn'])){
    /* ---> LOGIN <--- */
    list($login, $password) = explode("&&", $_POST['logIn']);
    
    $user = mysqli_query($link, "SELECT * FROM `users` WHERE (`login`='{$login}' OR `email`='{$login}') AND `password`='{$password}'");
    if (mysqli_num_rows($user) > 0){
        while ($result = mysqli_fetch_assoc($user)){
          $log = $result['login'];
        }
        $_SESSION['user'] = $log;
        $response = 'success';
    } else {$response = 'error';}

    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

function code(){
    $code = '';
    for ($i = 0; $i < 6; $i++){
        $code .= rand(0,9);
    }
    return $code;
}

if (isset($_POST['mailCode'])){
    $email = $_POST['mailCode'];

    if (isset($_SESSION['mail'])){
        $time = time(); 
        if ($time - $_SESSION['mail'] >= 120){
            $response = 'success';
            $_SESSION['mail'] = time();
        } else {
            $response = 120 - ($time - $_SESSION['mail']);  
        }
    } else {
        $response = 'success';
        $_SESSION['mail'] = time();
    }
    
    if ($response == 'success'){
        $code = code();
        $subject = 'Подтверждение кода из письма';
        $mess = "Кто-то пытается использовать вашу почту на сайте swingfox.ru. Код необходим для подтверждения почты на сайте. Никому не сообщайте код из письма!&&{$code}";
        $myMail = myMail($email, $subject, $mess);
        $id = id();
        mysqli_query($link, "INSERT INTO `mails`(`id`, `email`, `mess`, `subject`) VALUES ('{$id}','{$email}','{$mess}','{$subject}')");
        $_SESSION['mail_code'] = array($email ,$code);
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['passRecovery'])){
    list($email, $mail_code, $password) = explode("&&", $_POST['passRecovery']);
    if (isset($_SESSION['mail_code'])){
        if ($email == $_SESSION['mail_code'][0] && $mail_code == $_SESSION['mail_code'][1]){
            mysqli_query($link, "UPDATE `users` SET `password` = '{$password}' WHERE `email` = '{$email}'");
            $response = 'success';
            unset($_SESSION['mail_code']);
        } else {
            $response = 'code_error';
        }
    } else {
        $response = 'code_error';
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['AuthReg'])){
  list($reg, $about, $individe) = explode("***", $_POST['AuthReg']);
  list($email, $mail_code, $login, $password, $password_repeat) = explode("_*_", $reg);

  if (isset($_SESSION['mail_code'])){
    if ($email == $_SESSION['mail_code'][0] && $mail_code == $_SESSION['mail_code'][1]){
      $edentic = mysqli_query($link, "SELECT * FROM `users` WHERE `login` = '{$login}' OR `email` = '{$email}'");

      if (mysqli_num_rows($edentic) == 0){
        list($country,$city, $status, $search_status, $search_age, $location, $mobile, $info) = explode("_*_", $about);
        list($date, $height, $weight, $smoking, $alko) = explode("_*_", $individe);
        

        $id = id();
        $geo = setGeo();
        //$geo = '12.12421&&11.234234';
        $now = strtotime('now');
        $now_date = date('Y-m-d');
        $online = date("Y-m-d H:i");

        $ava = "no_photo.jpg";

        $query = mysqli_query($link, "INSERT INTO `users`(`id`, `login`, `email`, `password`, `ava`, `status`,`country` ,`city`, `geo`, `registration`, `info`, `online`, `viptype`, `images`, `search_status`, `search_age`, `location`, `mobile`, `height`, `weight`, `smoking`, `alko`, `date`) VALUES ('{$id}','{$login}','{$email}','{$password}','{$ava}','{$status}','{$country}','{$city}','{$geo}','{$now_date}','{$info}','{$online}','free','','{$search_status}','{$search_age}','{$location}','{$mobile}','{$height}','{$weight}','{$smoking}','{$alko}', '{$date}')");
        $_SESSION['user'] = $login;
        unset($_SESSION['mail_code']);
        $response = 'success';
      } else {
        while ($edentic_user = mysqli_fetch_assoc($edentic)){
          $edentic_login = $edentic_user['login'];
          $edentic_email = $edentic_user['email']; 
        }
        if ($login == $edentic_login){
          $response = 'edentic_login';
        }
        if ($email == $edentic_email){
          $response = 'edentic_email';
        }
      }
    } else {
      $response = 'code_error';
    }
  } else {
    $response = 'code_error';
  }

  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['subBuy'])){
  if (isset($_SESSION['user'])){
    $login = $_SESSION['user'];
    $jsonData = explode("&&", $_POST['subBuy']);
    list($type, $auto) = $jsonData;
    $me = mysqli_query($link, "SELECT * FROM `users` WHERE `login`='{$login}'");
    while ($result = mysqli_fetch_assoc($me)){
      $viptype = $result['viptype'];
      $balance = $result['balance'];
    }

    if ($type !== null){
      if ($type == 'VIP'){
        $pay = 350;
      } if ($type == 'PREMIUM'){
        $pay = 500;
      }
      if ($viptype == 'FREE'){
        if ($balance - $pay >= 0){
          $now = strtotime('now');
          $date = date("Y-m-d", $now + 2592000);
          mysqli_query($link, "INSERT INTO `subs`(`id`, `login`, `viptype`, `date`, `auto`) VALUES ('{$id}','{$login}','{$type}','{$date}','{$date}')");
          mysqli_query($link, "UPDATE `users` SET `balance`=`balance`-{$pay}, `viptype` = '{$type}' WHERE `login`='{$login}'");
          $response = 'success';
        } else {
          $response = 'low_balance';
        }
      } else {
        if ($balance - $pay >= 0){
          mysqli_query($link, "UPDATE `subs` SET `date`= DATE_ADD(date, INTERVAL 1 month), `auto`= '{$auto}', `viptype`='{$type}' WHERE `login`='{$login}'");
          mysqli_query($link, "UPDATE `users` SET `balance`=`balance`- {$pay}, `viptype` = '{$type}' WHERE `login`='{$login}'");
          $response = 'success';
        } else {
          $response = 'low_balance';
        }
      }
    } else {
      $response = 'null';
    }
  } else {
    $response = 'no_session';
  }
  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['sendGift'])){
  if (isset($_SESSION['user'])){
    $giftType = $_POST['sendGift'];
    $login = $_SESSION['user'];
    $me = mysqli_query($link, "SELECT * FROM `users` WHERE `login`='{$login}'");
    while ($result = mysqli_fetch_assoc($me)){
      $balance = $result['balance'];
    }
    if (isset($_SESSION['last_slide'])){
      $last_slides = explode("&&",$_SESSION['last_slide']);

      if (count($last_slides) > 1){
          $user_gift = $last_slides[1];
      } else {
          $user_gift = $last_slides[0];
      }
      
      if ($giftType !== null){
        $pay = $giftType;
        if ($balance - $pay >= 0){
          $id = id();
          $date = date('Y-m-d');
          mysqli_query($link,"INSERT INTO `gifts`(`id`, `owner`, `from`, `gifttype`, `date`, `valide`) VALUES ('{$id}','{$user_gift}','{$login}','{$giftType}','{$date}', '1')");
          mysqli_query($link, "UPDATE `users` SET `balance`=`balance`- {$pay} WHERE `login`='{$login}'");
          mysqli_query($link, "INSERT INTO `notifs`(`id`, `by`, `to`, `type`, `mess`) VALUES ('{$id}', '{$me}','{$user_gift}', 'gift', '{$giftType}')");
          $response = 'success';
        } else {
          $response = 'low_balance';
        }
      } else {
        $response = 'null';
      }
    } else {
      $response = 'no_last';
    }
  } else {
    $response = 'no_session';
  }
  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['lockedImages_open'])){
  $password = $_POST['lockedImages_open'];
  if (isset($_SESSION['last_slide'])){
    $user = $_SESSION['last_slide'];
    $data = mysqli_query($link, "SELECT * FROM `users` WHERE `login`='{$user}' AND `images_password` = '{$password}'");
    if (mysqli_num_rows($data) > 0){
      $response = 'success';
      if (isset($_SESSION['lockedImages'])){
        $_SESSION['lockedImages'] .= "***{$user}&&{$password}";
      } else {
        $_SESSION['lockedImages'] = "{$user}&&{$password}";
      }
    } else {
      $response = 'err_pass';
    }
    
    $me = mysqli_query($link, "SELECT `viptype` FROM `users` WHERE `login` = '{$_SESSION['user']}'");
    while ($result = mysqli_fetch_assoc($me)){
      $viptype = $result['viptype'];
    } if ($viptype == 'FREE'){
      $response = 'no_root';
    }
  } else {$response = 'no_session';}
  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['pP_myC_del'])){
  if (isset($_SESSION['user'])){
    $user = $_SESSION['user'];
    $data = mysqli_query($link, "SELECT * FROM `users` WHERE `login`='{$user}'");
    list($num, $type) = explode("&&", $_POST['pP_myC_del']);
    while ($ud = mysqli_fetch_array($data)){
      $the_images = $ud[$type];  
    }

    $the_img = explode("&&", $the_images);
    $the_img = array_reverse($the_img, false);
    $filename = $the_img[$num];
    unset($the_img[$num]);
    $the_img = array_reverse($the_img, false);
    $the_images = implode("&&", $the_img);

    $path = 'uploads/'.$filename;
    unlink($path);

    mysqli_query($link, "UPDATE `users` SET `{$type}` = '{$the_images}' WHERE `login`='{$user}'");
    $response = 'success';
  } else {
    $response = 'no_session';
  }
  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['pP_myC_add'], $_POST['pma_type'])){
  if (isset($_SESSION['user'])){
    $login = $_SESSION['user'];
    $type = $_POST['pma_type'];
    $user = mysqli_query($link, "SELECT `{$type}`, `viptype` FROM `users` WHERE `login` = '{$login}'");
    while ($result = mysqli_fetch_assoc($user)){
      $images = explode("&&", $result[$type]);
      $viptype = $result['viptype'];
    }
    if (strlen($images[0]) > 0){
      $images[] = $_POST['pP_myC_add'];
      $images = implode("&&", $images);
    } else {
      $images = $_POST['pP_myC_add'];
    }

    if ($type == 'locked_images' && $viptype == 'FREE'){
      $response = 'no_root';
    } else {
      mysqli_query($link, "UPDATE `users` SET `{$type}`='{$images}' WHERE `login`='{$login}'");
      $response = 'success';
    }
  } else {
    $response = 'no_session';
  }

  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['avaComplete'])){
  if (isset($_SESSION['user'])){
      $login = $_SESSION['user'];
      list($a,$b,$x,$y,$filename,$filetype) = explode("&&",$_POST['avaComplete']);
      $src = "uploads/{$filename}";
      //$response = error_get_last();
      $size = getimagesize("uploads/{$filename}");
      $w = $b / ($a / $size[0]);
      $h = $w;
      $x = $x / ($a / $size[0]);
      $y = $y / ($a / $size[0]);

      $exif = exif_read_data($src);

      if ($filetype == 'jpg' || $filetype == 'jpeg'){
          $img_create = imagecreatefromjpeg($src);
      } if ($filetype == 'png'){
          $img_create = imagecreatefrompng($src);
      } if ($filetype == 'webp'){
          $img_create = imagecreatefromwebp($src);
      }

      if (!empty($exif['Orientation'])) {
    
        switch ($exif['Orientation']) {
          case 3:
            $img_create = imagerotate($img_create, 180, 0);
            break;
    
          case 6:
            $img_create = imagerotate($img_create, -90, 0);
            break;
    
          case 8:
            $img_create = imagerotate($img_create, 90, 0);
            break;
        }
      }

      $to_crop_array = array('x' => $x , 'y' => $y, 'width' => $w, 'height'=> $h);
      $img = imagecrop($img_create, $to_crop_array);

      $id = id();
      $newname = $id.".png";
      
      if ($img_сreate !== false){
          header( "Content-type: image/png" );
          $save = "uploads/".$newname;
          chmod($save,0755);
          imagepng($img, $save, 0, NULL);
          imagedestroy($img);
          imagedestroy($img_create);
          $path = "/uploads/{$newname}";
          mysqli_query($link, "UPDATE `users` SET `ava` = '{$newname}' WHERE `login` = '{$login}'");
          $response = "success";
      } else {
          $response = "error";
      }
  } else {
      $response = "no_session";
  }
  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['filloutSettings'])){
  list($about, $individe) = explode("***", $_POST['filloutSettings']);

  if (isset($_SESSION['user'])){
    $login = $_SESSION['user'];

    list($country,$city, $status, $search_status, $search_age, $location, $mobile, $info) = explode("_*_", $about);
    list($date, $height, $weight, $smoking, $alko) = explode("_*_", $individe);
    
    $id = id();
    $geo = setGeo();
    //$geo = '12.12421&&11.234234';
    $now = strtotime('now');
    $online = date("Y-m-d H:i");

    $ava = "no_photo.jpg";

    $sql = "UPDATE `users` SET
    `country`='{$country}', `city`='{$city}', `status`='{$status}', `search_status`= '{$search_status}' ,`search_age`='{$search_age}',
    `location`='{$location}', `mobile`='{$mobile}', `info`='{$info}',
    `date`='{$date}',`height`='{$height}',`weight`='{$weight}',`smoking`='{$smoking}',`alko` = '{$alko}'
    WHERE `login`='{$login}'";

    $query = mysqli_query($link, $sql);
    $response = 'success';

  } else {
    $response = 'no_session';
  }

  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['leave'])){
  if (isset($_SESSION['user'])){
    unset($_SESSION['user']);
    $response = 'success';
  } else {
    $response = 'no_session';
  }
  if (isset($_SESSION['admin'])){unset($_SESSION['admin']);}

  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['messSend'])){
  list($assist ,$mess, $files) = explode('&&', $_POST['messSend']);
  if (strlen($mess) > 0 || $files != '0'){
    $id = id();
    if (isset($_SESSION['user'])){
      $login = $_SESSION['user'];
      $date = date('Y-m-d H:i');
      mysqli_query($link, "INSERT INTO `chat`(`id`, `by`, `to`, `mess`, `img`, `date`) VALUES ('{$id}','{$login}','{$assist}','{$mess}', '{$files}', '{$date}')");
      $response = 'success';
    } else {
      $response = 'no_session';
    }
  } else {
    $response = 'error';
  }
  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['chatReturn'])){
  $assist = $_POST['chatReturn'];
  if (isset($_SESSION['user'])){
    $login = $_SESSION['user'];
    $chat = mysqli_query($link, "SELECT * FROM `chat` WHERE (`by`='{$login}' AND `to`='{$assist}') OR (`to`='{$login}' AND `by`='{$assist}') ORDER BY `id` DESC");
    /* ===> MY CODE <=== */    
    $_SESSION['liveChat'] = mysqli_query($link, "SELECT * FROM `chat` WHERE (`by`='{$login}' AND `to`='{$assist}') OR (`to`='{$login}' AND `by`='{$assist}') ORDER BY `id` DESC LIMIT 5");
    if (mysqli_num_rows($chat) > 0){
      $elem = "";
      while ($mess = mysqli_fetch_array($chat)){
        if ($mess['by'] == $login){
          $elem .= "
          <div class='messWidget_byMe'>
                <div class='mess_byMe'>";
        } else {
          $elem .= "
          <div class='messWidget_toMe'>
                <div class='mess_toMe'>";
        }
        $elem .= nl2br($mess['mess']);
        if ($mess['img'] != '0'){
          $images = explode("&&", $mess['img']);
          foreach ($images as $img){
            $elem .= "<img src='/uploads/{$img}' class='chatImg' onclick='imageReveal(this)'>";
          }
        }
        $date = substr($mess['date'], 0, -3);
        $elem .= "<i class='mess_date'>{$date}</i>
          </div>
        </div>";
        
      }
      $response = $elem;
      mysqli_query($link, "UPDATE `chat` SET `read`= 1 WHERE `by`='{$assist}' AND `to`='{$login}' ");

    } else {
      $response = '0';
    }
  }
  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['chatChecker'])){
  $assist = $_POST['chatChecker'];
  if (isset($_SESSION['user']) && $_SESSION['liveChat'] !== null){
    $login = $_SESSION['user'];
    $live_chat = $_SESSION['liveChat'];
    $chat = mysqli_query($link, "SELECT * FROM `chat` WHERE (`by`='{$login}' AND `to`='{$assist}') OR (`to`='{$login}' AND `by`='{$assist}') ORDER BY `id` DESC LIMIT 5");
    
    if ($live_chat != $chat){
      $response = 'isset';
    } else {
      $response = 'empty';
    }
  } else {
    $response = 'no_session';
  }
  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['chatStatusSender'])){
  list($assist, $status) = explode("&&", $_POST['chatStatusSender']);
  
  if (isset($_SESSION['user'])){
    $login = $_SESSION['user'];
    $time = time();
    mysqli_query($link, "INSERT INTO `status`(`time`, `login`, `type`) VALUES ('{$time}','{$login}','{$status}')");

    $assist_data = mysqli_query($link, "SELECT * FROM `status` WHERE {$time} - `time` <= 2 AND `login`='{$assist}' ORDER BY `time` DESC LIMIT 1");
    if (mysqli_num_rows($assist_data) > 0){
      while ($result = mysqli_fetch_array($assist_data)){
        $statusType = $result['type'];
      }
      if ($statusType == 'typing'){
        $response = 'печатает..';
      } else {
        $response = 'онлайн';
      }

    } else {
      $last_data = mysqli_query($link, "SELECT * FROM `status` WHERE {$time} - `time` <= 300 AND `login`='{$assist}' ORDER BY `time` DESC LIMIT 1");
      if (mysqli_num_rows($last_data) > 0){
        $response = 'онлайн';
      } else {
        $last_online = mysqli_query($link, "SELECT * FROM `status` WHERE `login`='{$assist}' ORDER BY `time` DESC");
        while ($mark = mysqli_fetch_array($last_online)){
          $online = date('Y-m-d H:i', $mark['time']);
        }
        $response = "был ".$online;
      }
    }

  } else {
    $response = 'no_session';
  }

  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['adsCreate'])){
  list($desc, $type) = explode("&&", $_POST['adsCreate']);
  if (isset($_SESSION['user'])){
    $login = $_SESSION['user'];
    $user = mysqli_query($link, "SELECT `viptype`,`country` ,`city` FROM `users` WHERE `login` = '{$login}' ");
    while ($us = mysqli_fetch_array($user)){
      list($viptype, $country ,$city) = $us;
    }
    if ($viptype != 'FREE'){
      $root = 1;
    } else {
      $my_ads = mysqli_query($link, "SELECT * FROM `ads` WHERE `login`='{$login}'");
      if (mysqli_num_rows($my_ads) > 0){
        $root = 'isset';
      } else {
        $root = 1;
      }
    }
    if ($root == 1){
      $id = id();
      mysqli_query($link, "INSERT INTO `ads`(`id`, `login`, `type`, `desc`, `country` ,`city`) VALUES ('{$id}', '{$login}', '{$type}', '{$desc}','{$country}' ,'{$city}')");
      $response = 'success';
    }
    
  } else {
    $response = 'no_session';
  }
  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['adsMyDel'])){
  $id = $_POST['adsMyDel'];
  if (isset($_SESSION['user'])){
    $login = $_SESSION['user'];
    mysqli_query($link, "DELETE FROM `ads` WHERE `id`='{$id}' AND `login`='{$login}'");
    $response = 'success';
  } else {
    $response = 'no_session';
  }
  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['eventApplicSend'])){
  $id = $_POST['eventApplicSend'];
  if (isset($_SESSION['user'])){
    $login = $_SESSION['user'];
    $event_data = mysqli_query($link, "SELECT * FROM `events` WHERE `id`={$id} ");
    if (mysqli_num_rows($event_data) > 0){
      while ($event = mysqli_fetch_array($event_data)){
        $applics = $event['applics'];
      }
      if ($applics != '0'){
        $applics .= "&&{$login}";
      } else {
        $applics = $login;
      }

      $sql = "UPDATE `events` SET `applics`='{$applics}' WHERE `id`='{$id}'";
      if (mysqli_query($link, $sql)){
        $response = 'success';
      } else {
        $response = 'error';
      }
    } else {
      $response = 'error';
    }
  } else {
    $response = 'no_session';
  }
  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['applicToCreateClub'])){
  $info = $_POST['applicToCreateClub'];

  $id = id(); $date = date('Y-m-d H:i');
  mysqli_query($link, "INSERT INTO `a_t_c_club`(`id`, `date`, `info`, `resp`) VALUES ('{$id}','{$date}','{$info}', 0)");
  $response = 'success';

  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['getGeo'])){
  if ($_POST['getGeo'] != ''){
    /* ===> MY CODE <=== */
    $sql = "SELECT * FROM `geo` WHERE `country`='{$_POST['getGeo']}'";
  } else {
    $sql = "SELECT * FROM `geo` GROUP BY `country`";
  }
  $data = mysqli_query($link, $sql);
  if (mysqli_num_rows($data)){
    $countries = ""; $cities = "";
    while ($result = mysqli_fetch_array($data)){
      $countries .= "<option value='{$result['country']}'>{$result['country']}</option>";
      $cities .= "<option value='{$result['city']}'>{$result['city']}</option>";
    }
    $response = implode("&&", [$countries, $cities]); 
  } else {
    $response = 'error';
  }
  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['eventCreate'])){
  list($club_id, $name, $desc, $date, $country, $city, $img) = json_decode($_POST['eventCreate'], true);
  if (isset($_SESSION['user'])){
    $login = $_SESSION['user'];
    $the_club = mysqli_query($link, "SELECT `owner`,`admins` FROM `clubs` WHERE `id`='{$club_id}'");
    while ($cl = mysqli_fetch_assoc($the_club)){
      $admins = explode('&&', $cl['admins']);
      $owner = $cl['owner'];
    } if (in_array($login, $admins) === true || $owner == $login){
      $id = id();
      mysqli_query($link, "INSERT INTO `events`(`id`, `owner`, `name`, `desc`, `date`, `country`, `city`, `applics`, `img`) VALUES ('{$id}','{$club_id}','{$name}','{$desc}','{$date}','{$country}','{$city}','0','{$img}')");
      $response = 'success';
    } else {
      $response = 'no_root';
    }
  } else {
    $response = 'no_session';
  } 
  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['profileVisit'])){
  $name = $_POST['profileVisit'];
  if (isset($_SESSION['user'])){
    $login = $_SESSION['user']; $id = id();
    $me = mysqli_query($link, "SELECT `viptype` FROM `users` WHERE `login`='{$login}'");
    while ($us = mysqli_fetch_array($me)){
      $viptype = $us['viptype'];
    }
    $date = date('Y-m-d H:i:s');
    if ($viptype == 'FREE'){
      mysqli_query($link, "INSERT INTO `visits`(`id`, `who`, `whom`, `date`) VALUES ({$id},'{$login}','{$name}','{$date}')");
    }
  }
}

if (isset($_POST['checkVisits'])){
  if (isset($_SESSION['user'])){
    $login = $_SESSION['user'];
    $last_visits = mysqli_query($link, "SELECT * FROM `visits` WHERE `whom` = '{$login}' AND `date` >= DATE_SUB(NOW(), INTERVAL 1 MINUTE ) ");
    if (mysqli_num_rows($last_visits) > 0){
      $response = 'isset';
    } else {
      $response = 'empty';
    }
  } else {
    $response = 'no_session';
  }
  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}
if (isset($_POST['lockedImages_passCreate'])){
  $password = $_POST['lockedImages_passCreate'];
  if (isset($_SESSION['user'])){
    $login = $_SESSION['user'];
    mysqli_query($link, "UPDATE `users` SET `images_password` = '{$password}' WHERE `login` = '{$login}'");
    $response = 'success';
  } else {
    $response = 'no_session';
  }
  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

/*if (isset($_POST['imageReveal'])){
  $src = $_POST['imageReveal'];
  if (isset($_SESSION['user']) === true){
    $data = mysqli_query($link, "SELECT `login`, `value` FROM `reactions` WHERE `img`='{$src}'");
    if (mysqli_num_rows($data) > 0){ 
      $my = 0;
      while ($result = mysqli_fetch_array($data)){
        list($login, $value) = $result;

        if ($login == $_SESSION['user']){
          $my = $value;
        }
      } 
      $total = mysqli_query($link, "SELECT SUM(`value`) AS TotalValue FROM `reactions` WHERE `img`='{$src}'");
      $response = implode("&&" ,[$total , $my]);

    } else {
      $response = implode("&&", [0 , 0]);
    }
    
  } else {
    $response = 'no_session';
  }

  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}*/

if (isset($_POST['ratingSet'])){
  list($user, $value) = json_decode($_POST['ratingSet'], true);
  $value = match($value){
    'plus' => 1,
    'minus' => -1,
  };
  $now = date('Y-m-d');
  if (isset($_SESSION['user'])){

    if ($_SESSION['user'] != $user){ // самому себе нельзя поставить рейтинг
      $my_rate = mysqli_query($link , "SELECT `value` FROM `rating` WHERE `from`='{$_SESSION['user']}' AND `to`='{$user}'");
      if (mysqli_num_rows($my_rate) > 0){
        $sql = "UPDATE `rating` SET `value` = '{$value}', `date`='{$now}' WHERE `from` = '{$_SESSION['user']}' AND `to`='{$user}'";
      } else {
        $sql = "INSERT INTO `rating`(`from`, `to`, `value`, `date`) VALUES ('{$_SESSION['user']}' , '{$user}', '{$value}', '{$now}')";
      }

      mysqli_query($link, $sql); $response = 'success';
    } 

  } else {
    $response = 'no_session';
  }

  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['imageGetLikes'])){
  $img = $_POST['imageGetLikes'];

  if (isset($_SESSION['user'])){ $login = $_SESSION['user']; 
    $my_likes = mysqli_query($link, "SELECT `date` FROM `img_likes` WHERE `img`='{$img}' AND `from` = '{$login}'"); // my
    $likes = mysqli_query($link, "SELECT `from`, `date` FROM `img_likes` WHERE `img`='{$img}'"); // total
    if (mysqli_num_rows($my_likes) > 0 ){$my = 1;} else {$my = 0;}
    $total = mysqli_num_rows($likes);

    $response = implode("&&" ,array($my , $total));
  } else {
    $response = 'no_session';
  }

  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['imageLike'])){
  list($img, $my_like) = json_decode($_POST['imageLike'], true);
  if (isset($_SESSION['user'])) {
    $login = $_SESSION['user'];
    if ($my_like == '0'){
      $date = date('Y-m-d H:i');
      $sql = "INSERT INTO `img_likes`(`from`,`img`,`date`) VALUES ('{$login}', '{$img}', '{$date}')";
    } else {
      $sql = "DELETE FROM `img_likes` WHERE `from`='{$login}' AND `img`= '{$img}'";
    }
    mysqli_query($link, $sql);
    $response = 'success';
  } else {
    $response = 'no_session';
  }

  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['getNew_mess'])){
  if (isset($_SESSION['user'])){
    $login = $_SESSION['user'];
    $new_messages = mysqli_query($link, "SELECT `id` FROM `chat` WHERE `to` = '{$login}' AND `read`= 0 ");
    $newMess_count = mysqli_num_rows($new_messages);
    if ($newMess_count > 0 ){
      $response = "<div class='newMess_popupBox' onclick='window.location.href = `/assists.php`;'>
        <img src='/img/notif.png' class='newMess_ico'>
        <h4 style='font-size: 14.3px'>У вас {$newMess_count} новых сообщений. Перейдите в чаты, чтобы их увидеть)</h4>
        </div>";
    } else {
      $response = '';
    }
  } else {
    $response = 'no_session';
  }

  echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

?>