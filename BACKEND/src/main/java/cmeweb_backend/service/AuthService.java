package cmeweb_backend.service;

import cmeweb_backend.dto.LoginDto;
import cmeweb_backend.model.Usuario;
import cmeweb_backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    public boolean validarLogin(LoginDto dto) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsuario(dto.getUsuario());

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();

            return usuario.getSenha().equals(dto.getSenha());
        }

        return false;
    }
}