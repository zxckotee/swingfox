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

function id(){
    $id = time();
    for ($i = 0; $i < 3; $i++){
        $id .= rand(0,9);
    }
    return $id;
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

if (isset($_POST['adminAuth'])){
    list($login, $password) = explode("&&", $_POST['adminAuth']);
    $data = mysqli_query($link, "SELECT * FROM `moders` WHERE `login`='{$login}' AND `password`='{$password}'");
    if (mysqli_num_rows($data) > 0){
        $_SESSION['admin'] = $login;
        $response = 'success';
    } else {
        $response = "error";
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['applicConfirm'])){
    $id = $_POST['applicConfirm'];
    if (isset($_SESSION['admin'])){
        mysqli_query($link, "UPDATE `a_t_c_club` SET `resp`= 1");  
        /* ===> MY CODE <=== */
        $data = mysqli_query($link, "SELECT * FROM `a_t_c_club` WHERE `id`='{$id}'");
        while ($result = mysqli_fetch_array($data)){
          list($id, $date, $info, $resp) = $result;
        }

        $id = id(); $date = date('Y-m-d H:i');
        $info = explode("&&", $info);
        $info[5] .= " {$info[4]}"; // owner -> admin 
        $sql = "INSERT INTO `clubs`(`id`, `name`, `country`, `city`, `address`, `owner`, `admins`, `links`, `desc`, `ava`, `date`) VALUES ('{$id}'";
        
        foreach($info as $i){
          if (trim($i) == ''){
            $i = trim($i);
          }
          $sql .= ",'{$i}'";
        }
        $sql .= ", 'no_photo.jpg', '{$date}')";

        mysqli_query($link, $sql);
        $response = 'success';
    } else {
        $response = 'no_session';
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

if (isset($_POST['applicDispute'])){
    $id = $_POST['applicDispute'];
    if (isset($_SESSION['admin'])){
        mysqli_query($link, "UPDATE `a_t_c_club` SET `resp`= 2");
        $response = 'success';
    } else {
        $response = 'no_session';
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

?>