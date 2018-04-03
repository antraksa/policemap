<?php
$back = '<p><a href="javascript:history.back()">Назад к контактной форме</a></p>';
    if(isset($_POST['g-recaptcha-response']) && !empty($_POST['g-recaptcha-response'])):
		//your site secret key
        $secret = '6Letl0kUAAAAAGQJOdTKU8sZMHLN8TXa7n8vMTxb';
		//get verify response data
        $verifyResponse = file_get_contents('https://www.google.com/recaptcha/api/siteverify?secret='.$secret.'&response='.$_POST['g-recaptcha-response']);
        $responseData = json_decode($verifyResponse);

		$name = Trim(stripslashes($_POST['name']));
		$contact = Trim(stripslashes($_POST['contact']));
		$message = Trim(stripslashes($_POST['message']));

        if($responseData->success):
			//contact form submission code
			$to = 'antraksamail@gmail.com,policemap.ru@gmail.com';
			$subject = 'Письмо с сайта policemap.ru';
			$htmlContent = "
				<p><b>ФИО: </b>".$name."</p>
				<p><b>Контакт: </b>".$contact."</p>
				<p><b>Сообщение: </b>".$message."</p>
			";
			$htmlContent3 = "<h1>Текст обращения:</h1>". $htmlContent;
			// Always set content-type when sending HTML email
			$headers = "MIME-Version: 1.0" . "\r\n";
			$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
			// More headers
			$headers .= 'From:'.$name.' <no-reply@policemap.ru>' . "\r\n";
			//send email
			@mail($to,$subject,$htmlContent3,$headers);

            $succMsg = '<p class="msg succ">Ваше сообщение успешно отправлено!</p>'.$back;
            print "$succMsg";
			$name = '';
			$contact = '';
			$message = '';
        else:
            $errMsg = '<p class="msg err">Пожалуйста, подтвердите, что вы не робот!</p>'.$back;
            print "$errMsg";
        endif;
    else:
        $errMsg = '<p class="msg err">Пожалуйста, подтвердите, что вы не робот!</p>'.$back;
        print "$errMsg";
    endif;

?>
